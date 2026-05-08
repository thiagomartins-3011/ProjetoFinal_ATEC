using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ProjetoFinalBackend.Extensions
{
    public static class ExternalAuthExtensions
    {
        public static IServiceCollection AddExternalAuthentication(this IServiceCollection services, IConfiguration config)
        {
            services.AddAuthentication(options =>
            {
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddCookie() // necessário para manter sessão
            .AddGoogle(googleOptions =>
            {
                googleOptions.ClientId = config["Authentication:Google:ClientId"];
                googleOptions.ClientSecret = config["Authentication:Google:ClientSecret"];
            });

            return services;
        }
    }
}