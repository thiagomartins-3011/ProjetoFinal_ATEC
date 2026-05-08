using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ProjetoFinalBackend.Middleware;
using ProjetoFinalBackend.Services;
using Serilog;
using System.Text;

// Configurar Serilog antes de tudo
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting", Serilog.Events.LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File(
        path: "logs/log-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("A iniciar a aplicação SoundStore...");

    var builder = WebApplication.CreateBuilder(args);

    // Usar Serilog como logger do ASP.NET Core
    builder.Host.UseSerilog();

    // Chave JWT lida do appsettings.json
    var jwtKey = builder.Configuration["Jwt:Key"];

    // Controllers
    builder.Services.AddControllers();

    // EmailService registado para injeção de dependência
    builder.Services.AddScoped<EmailService>();

    // ExpoNotificationService registado para injeção de dependência
    builder.Services.AddHttpClient<ExpoNotificationService>();

    // Configuração JWT
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

    builder.Services.AddAuthorization();

    // CORS (permitir React)
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowReact",
            policy =>
            {
                policy.WithOrigins("http://localhost:5173")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // Middleware global de exceções (deve ser o primeiro)
    app.UseMiddleware<ExceptionMiddleware>();

    app.UseSerilogRequestLogging();

    app.UseHttpsRedirection();
    app.UseStaticFiles();
    app.UseCors("AllowReact");
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    Log.Information("Aplicação SoundStore iniciada com sucesso.");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "A aplicação terminou inesperadamente.");
}
finally
{
    Log.CloseAndFlush();
}
