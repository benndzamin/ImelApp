﻿namespace ImelApp.Server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;


        public bool IsActive { get; set; } = true;
        public UserRole Role { get; set; } = UserRole.User;


        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockoutEnd { get; set; }
    }

    public enum UserRole
    {
        User = 0,
        Admin = 1,
    }

}