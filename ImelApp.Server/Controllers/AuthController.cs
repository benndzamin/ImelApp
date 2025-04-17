using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ImelApp.Server.Models;
using ImelApp.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly string _key;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _key = configuration.GetValue<string>("JwtSettings:SecretKey")
               ?? throw new ArgumentNullException("JwtSettings:SecretKey", "The secret key must be provided.");
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null)
        {
            return Unauthorized(new { message = "Pogrešno korisničko ime ili lozinka." });
        }

        // Provjera da li je korisnik blokiran
        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
        {
            var timeLeft = user.LockoutEnd.Value - DateTime.UtcNow;
            return Unauthorized(new { message = $"Korisnik je privremeno blokiran. Pokušajte ponovo za {timeLeft.Minutes} minuta." });
        }

        // Provjeri lozinku
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            // Povećaj broj pokušaja prijave
            user.FailedLoginAttempts++;

            // Ako broj pokušaja dostigne 3, blokiraj korisnika
            if (user.FailedLoginAttempts >= 3)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(5); // Blokira korisnika na 5 minuta
            }

            await _context.SaveChangesAsync();

            return Unauthorized(new { message = "Pogrešno korisničko ime ili lozinka." });
        }

        // Resetuj broj neuspjelih pokušaja kada je prijava uspješna
        user.FailedLoginAttempts = 0;
        await _context.SaveChangesAsync();

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenKey = Encoding.UTF8.GetBytes(_key);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new Claim[]
            {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString() ?? "User")
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(tokenKey), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwt = tokenHandler.WriteToken(token);
        return Ok(new { token = jwt });
    }


    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users.ToListAsync();
        var userDtos = users.Select(u => new
        {
            u.Id,
            u.Username,
            u.Email,
            u.IsActive,
            Role = u.Role.ToString(),
            u.CreatedAt
        }).ToList();

        return Ok(userDtos);
    }


    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Token je u sessionStorage, ovdje se samo žalje potvrda
        return Ok(new { message = "Korisnik je uspešno izlogovan." });
    }

    // Brisanje korisnika po ID-u (samo admin)
    [Authorize(Roles = "Admin")]
    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "Korisnik nije pronađen." });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Korisnik uspješno obrisan." });
    }

    // Registracija novog korisnika
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Provjera da li korisnik već postoji po username ili emailu
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Korisnik sa ovim korisničkim imenom ili emailom već postoji." });
        }

        // Provjeri da li je rola validna
        if (!Enum.IsDefined(typeof(UserRole), request.Role))
        {
            return BadRequest(new { message = "Neispravna rola." });
        }

        // Ako rola nije poslana, postavi je na UserRole.User (0)
        var userRole = (UserRole)request.Role; // Pretvaramo int u UserRole

        // Hash lozinke
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Kreiraj novog korisnika
        var newUser = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = hashedPassword,
            IsActive = request.IsActive,
            Role = userRole // Postavljanje role korisnika dafault na user - samo admin može dati rolu admin!
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Korisnik uspješno registrovan." });
    }


    // Vraća samo korisničko ime prijavljenog korisnika
    [Authorize]
    [HttpGet("user")]
    public IActionResult GetUserData()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null)
        {
            return Unauthorized(new { message = "Korisnik nije autentifikovan." });
        }

        var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userIdClaim);

        if (user == null)
        {
            return Unauthorized(new { message = "Korisnik nije pronađen." });
        }

        return Ok(new { username = user.Username, email = user.Email, role = user.Role.ToString(),  created = user.CreatedAt, active = user.IsActive.ToString() });
    }



    [Authorize]
    [HttpGet("username")]
    public IActionResult GetUserName()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null)
        {
            return Unauthorized(new { message = "Korisnik nije autentifikovan." });
        }

        var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userIdClaim);

        if (user == null)
        {
            return NotFound(new { message = "Korisnik nije pronađen." });
        }

        return Ok(new { username = user.Username });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("edit/{id}")]
    public async Task<IActionResult> EditUser(int id, [FromBody] EditUserRequest request)
    {

        Console.WriteLine($"Stigao register zahtjev: Username={request.Username}, Email={request.Email}, Role={request.Role}");

        // Pronađi korisnika
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "Korisnik nije pronađen." });
        }

        // Ažuriranje polja ako su poslana
        if (!string.IsNullOrEmpty(request.Username))
            user.Username = request.Username;

        if (!string.IsNullOrEmpty(request.Email))
            user.Email = request.Email;

        if (!string.IsNullOrEmpty(request.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);  // Novi hash lozinke

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        if (request.Role.HasValue && Enum.IsDefined(typeof(UserRole), request.Role))
            user.Role = (UserRole)request.Role.Value;

        // Sačuvaj promene
        await _context.SaveChangesAsync();

        return Ok(new { message = "Korisnik je uspešno ažuriran." });
    }



}

// DTO - Model za zahtjev za login
public class LoginRequest
{
    public required string Username { get; set; }
    public required string Password { get; set; }
}


// DTO - Model za registraciju korisnika
public class RegisterRequest
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required bool IsActive { get; set; }
    public int Role { get; set; }

}

// DTO - Model za editovanje korisnika
public class EditUserRequest
{
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public bool? IsActive { get; set; }
    public int? Role { get; set; }
}