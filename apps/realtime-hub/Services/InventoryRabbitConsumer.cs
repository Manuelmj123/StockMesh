using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using realtime_hub.Models;

namespace realtime_hub.Services;

public sealed class InventoryRabbitConsumer : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly DashboardInventoryWriter _dashboardInventoryWriter;
    private readonly ILogger<InventoryRabbitConsumer> _logger;

    private IConnection? _connection;
    private IModel? _channel;

    public InventoryRabbitConsumer(
        IConfiguration configuration,
        DashboardInventoryWriter dashboardInventoryWriter,
        ILogger<InventoryRabbitConsumer> logger)
    {
        _configuration = configuration;
        _dashboardInventoryWriter = dashboardInventoryWriter;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await StartConsumerAsync(stoppingToken);
                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Inventory Rabbit consumer crashed. Retrying in 5 seconds.");
                Cleanup();

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }

    private Task StartConsumerAsync(CancellationToken stoppingToken)
    {
        var host = _configuration["RabbitMq:Host"] ?? "rabbitmq";
        var port = int.TryParse(_configuration["RabbitMq:Port"], out var parsedPort) ? parsedPort : 5672;
        var exchange = _configuration["RabbitMq:Exchange"] ?? "inventory.exchange";
        var queue = _configuration["RabbitMq:Queue"] ?? "inventory.dashboard.q";
        var routingKey = _configuration["RabbitMq:RoutingKey"] ?? "inventory.updated";

        var factory = new ConnectionFactory
        {
            HostName = host,
            Port = port,
            DispatchConsumersAsync = true
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        _channel.ExchangeDeclare(exchange, ExchangeType.Topic, durable: true, autoDelete: false);
        _channel.QueueDeclare(queue, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(queue, exchange, routingKey);
        _channel.BasicQos(0, 10, false);

        var consumer = new AsyncEventingBasicConsumer(_channel);

        consumer.Received += async (_, eventArgs) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(eventArgs.Body.ToArray());

                var message = JsonSerializer.Deserialize<InventoryReplicationMessage>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                if (message is null)
                {
                    _logger.LogWarning("Received empty or invalid inventory message.");
                    _channel.BasicAck(eventArgs.DeliveryTag, false);
                    return;
                }

                await _dashboardInventoryWriter.UpsertInventoryAsync(message, stoppingToken);

                _channel.BasicAck(eventArgs.DeliveryTag, false);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed processing inventory message.");
                _channel?.BasicNack(eventArgs.DeliveryTag, false, true);
            }
        };

        _channel.BasicConsume(queue: queue, autoAck: false, consumer: consumer);

        _logger.LogInformation("Inventory Rabbit consumer started. Queue: {Queue}", queue);

        return Task.CompletedTask;
    }

    public override Task StopAsync(CancellationToken cancellationToken)
    {
        Cleanup();
        return base.StopAsync(cancellationToken);
    }

    private void Cleanup()
    {
        try
        {
            _channel?.Close();
        }
        catch
        {
        }

        try
        {
            _connection?.Close();
        }
        catch
        {
        }

        _channel?.Dispose();
        _connection?.Dispose();

        _channel = null;
        _connection = null;
    }
}