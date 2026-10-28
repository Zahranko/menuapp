using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Storefront.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateArabic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CategoryAr",
                table: "Templates",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultSettingsAr",
                table: "Templates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "DescriptionAr",
                table: "Templates",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "Templates",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryAr",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "DefaultSettingsAr",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "DescriptionAr",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "Templates");
        }
    }
}
