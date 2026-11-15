using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Storefront.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PublisherProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublisherProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PublisherProfiles_Businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "Businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunityTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PublisherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    BaseTemplateId = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Settings = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Uses = table.Column<int>(type: "int", nullable: false),
                    IsListed = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityTemplates_Businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "Businesses",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CommunityTemplates_PublisherProfiles_PublisherId",
                        column: x => x.PublisherId,
                        principalTable: "PublisherProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityTemplates_Templates_BaseTemplateId",
                        column: x => x.BaseTemplateId,
                        principalTable: "Templates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityTemplates_BaseTemplateId",
                table: "CommunityTemplates",
                column: "BaseTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityTemplates_BusinessId",
                table: "CommunityTemplates",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityTemplates_Code",
                table: "CommunityTemplates",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityTemplates_IsListed_CreatedAt",
                table: "CommunityTemplates",
                columns: new[] { "IsListed", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityTemplates_IsListed_Uses",
                table: "CommunityTemplates",
                columns: new[] { "IsListed", "Uses" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityTemplates_PublisherId",
                table: "CommunityTemplates",
                column: "PublisherId");

            migrationBuilder.CreateIndex(
                name: "IX_PublisherProfiles_BusinessId",
                table: "PublisherProfiles",
                column: "BusinessId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PublisherProfiles_Username",
                table: "PublisherProfiles",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityTemplates");

            migrationBuilder.DropTable(
                name: "PublisherProfiles");
        }
    }
}
