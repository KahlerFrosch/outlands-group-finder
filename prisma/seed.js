const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PRESET_GROUPS = [
  {
    id: "preset-seed-001",
    contentType: "PvM",
    contentSubType: "Dungeons",
    contentTertiary: "Inferno",
    description: "Inferno dungeon run. Bring fire resist and DPS. We start at Britain moongate.",
    creatorDiscordId: "preset-creator-001",
    creatorName: "DungeonRunner"
  },
  {
    id: "preset-seed-002",
    contentType: "PvP",
    contentSubType: "Factions",
    contentTertiary: "Prevalia",
    description: "Prevalia faction night. Sign up if you want to join the fight.",
    creatorDiscordId: "preset-creator-002",
    creatorName: "FactionFan"
  },
  {
    id: "preset-seed-003",
    contentType: "Mentoring",
    contentSubType: null,
    contentTertiary: null,
    description: "Happy to answer questions and show new players around. Voice chat optional.",
    creatorDiscordId: "preset-creator-003",
    creatorName: "HelpfulHector",
    creatorRole: "Guide"
  },
  {
    id: "preset-seed-004",
    contentType: "PvM",
    contentSubType: "Pit Trials",
    contentTertiary: "5 Players",
    description: "Pit Trials 5-player. Need experienced team. Discord for coordination.",
    creatorDiscordId: "preset-creator-004",
    creatorName: "PitBoss"
  },
  {
    id: "preset-seed-005",
    contentType: "Roleplay",
    contentSubType: null,
    contentTertiary: null,
    description: "Weekly RP event in Britain. In-character only. All welcome.",
    creatorDiscordId: "preset-creator-005",
    creatorName: "RPGuild"
  },
  {
    id: "preset-seed-006",
    contentType: "PvM",
    contentSubType: "Society Jobs",
    contentTertiary: null,
    description: "Blacksmith and Alchemist dailies. Quick run, bring your job items.",
    creatorDiscordId: "preset-creator-006",
    creatorName: "Crafty"
  },
  {
    id: "preset-seed-007",
    contentType: "PvP",
    contentSubType: "Proving Grounds",
    contentTertiary: "4 Players",
    description: "Proving Grounds 4v4 practice. Bring meta templates.",
    creatorDiscordId: "preset-creator-007",
    creatorName: "ArenaAce"
  },
  {
    id: "preset-seed-008",
    contentType: "Custom",
    contentSubType: null,
    contentTertiary: null,
    description: "Fishing and chilling at the coast. No rush, just vibes.",
    creatorDiscordId: "preset-creator-008",
    creatorName: "FisherKing"
  },
  {
    id: "preset-seed-009",
    contentType: "PvM",
    contentSubType: "Quests",
    contentTertiary: null,
    description: "New Haven quest chain. We'll do them in order. First-timers welcome.",
    creatorDiscordId: "preset-creator-009",
    creatorName: "QuestQueen"
  }
];

async function main() {
  await prisma.group.deleteMany({});
  console.log("Cleared all groups from the database.");

  for (const g of PRESET_GROUPS) {
    const extraMembers =
      g.id === "preset-seed-001"
        ? [
            {
              discordId: "preset-member-001-2",
              name: "InfernoMage",
              isCreator: false,
              role: null
            },
            {
              discordId: "preset-member-001-3",
              name: "InfernoTank",
              isCreator: false,
              role: null
            },
            {
              discordId: "preset-member-001-4",
              name: "InfernoHealer",
              isCreator: false,
              role: null
            },
            {
              discordId: "preset-member-001-5",
              name: "InfernoRogue",
              isCreator: false,
              role: null
            }
          ]
        : g.id === "preset-seed-003"
          ? [
              {
                discordId: "preset-member-003-2",
                name: "NewbieNina",
                isCreator: false,
                role: "Student"
              },
              {
                discordId: "preset-member-003-3",
                name: "LearnerLeo",
                isCreator: false,
                role: "Student"
              }
            ]
          : g.id === "preset-seed-007"
            ? [
                {
                  discordId: "preset-member-007-2",
                  name: "ArenaMage",
                  isCreator: false,
                  role: null
                },
                {
                  discordId: "preset-member-007-3",
                  name: "ArenaTank",
                  isCreator: false,
                  role: null
                },
                {
                  discordId: "preset-member-007-4",
                  name: "ArenaHealer",
                  isCreator: false,
                  role: null
                }
              ]
            : [];

    await prisma.group.create({
      data: {
        id: g.id,
        contentType: g.contentType,
        contentSubType: g.contentSubType ?? null,
        contentTertiary: g.contentTertiary ?? null,
        description: g.description ?? "",
        members: {
          create: [
            {
              discordId: g.creatorDiscordId,
              name: g.creatorName,
              isCreator: true,
              role: g.creatorRole ?? null
            },
            ...extraMembers
          ]
        }
      }
    });
  }
  console.log("Seeded", PRESET_GROUPS.length, "preset groups.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
