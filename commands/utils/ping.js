const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = "https://api.github.com/repos/{owner}/{repo}/commits";
const GITHUB_OWNER = "waikboidev";
const GITHUB_REPO = "Comet";

const OWNER_ID = process.env.OWNER; 
const allowedIds = new Set([OWNER_ID]);

async function getLatestCommitTimestamp() {
    if (!GITHUB_TOKEN) {
        console.warn("GITHUB_TOKEN is not set. Cannot fetch commit timestamp.");
        return "GitHub Token not configured.";
    }
    const url = GITHUB_API_URL.replace("{owner}", GITHUB_OWNER).replace("{repo}", GITHUB_REPO);
    const headers = {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json"
    };

    try {
        const response = await fetch(url, { headers: headers });
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                const latestCommit = data[0];
                const commitId = latestCommit.sha.substring(0, 7);
                const commitDate = new Date(latestCommit.commit.committer.date);
                const timestamp = Math.floor(commitDate.getTime() / 1000);
                return `\`${commitId}\` ; <t:${timestamp}:R>`;
            }
            return "No commits found.";
        } else {
            console.error(`GitHub API Error: ${response.status} - ${await response.text()}`);
            return `GitHub API Error: ${response.status}`;
        }
    } catch (error) {
        console.error("Error fetching commit timestamp:", error);
        return "Error fetching commit data.";
    }
}

function formatUptime(botLaunchTime) {
    const now = new Date();
    let deltaSeconds = Math.floor((now.getTime() - botLaunchTime.getTime()) / 1000);

    if (deltaSeconds < 0) deltaSeconds = 0; // Should not happen, but as a safeguard

    const daysTotal = Math.floor(deltaSeconds / (3600 * 24));
    deltaSeconds -= daysTotal * 3600 * 24;

    const hours = Math.floor(deltaSeconds / 3600);
    deltaSeconds -= hours * 3600;

    const minutes = Math.floor(deltaSeconds / 60);
    deltaSeconds -= minutes * 60;

    const seconds = deltaSeconds;

    const uptimeParts = [];

    // Adhering to the original Python script's pluralization (e.g., "1 Hours")
    if (daysTotal >= 7) {
        const weeks = Math.floor(daysTotal / 7);
        uptimeParts.push(`${weeks} weeks`);
    } else if (daysTotal > 0) {
        uptimeParts.push(`${daysTotal} days`);
    }

    if (hours > 0) uptimeParts.push(`${hours} Hours`);
    if (minutes > 0) uptimeParts.push(`${minutes} Minutes`);
    
    if (seconds > 0 || uptimeParts.length === 0) {
        uptimeParts.push(`${seconds} Seconds`);
    }

    if (uptimeParts.length === 0) return "0 Seconds"; // Should be covered if seconds is 0
    if (uptimeParts.length === 1) return uptimeParts[0];

    const lastPart = uptimeParts.pop();
    return uptimeParts.join(", ") + " and " + lastPart;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Sends the bot latency, uptime, and latest commit info."),
    async execute(interaction) {
        if (!interaction.client.launchTime) {
            console.error("client.launchTime is not set!");
            return interaction.reply({ content: "Bot launch time not configured. Please contact the bot owner.", ephemeral: true });
        }

        let commitTs = "`No Permission`";
        if (allowedIds.has(interaction.user.id)) {
            commitTs = await getLatestCommitTimestamp();
        }

        const latency = Math.round(interaction.client.ws.ping);
        let color = Colors.Green; // Default: 0x62de43
        let statusreport = "Bot latency is normal.";

        if (latency > 200) {
            color = 0x941616; 
            statusreport = "Bot latency is concerningly high.";
        } else if (latency > 150) {
            color = 0xc54343; 
            statusreport = "Bot latency is very high.";
        } else if (latency > 100) {
            color = 0xddbb42; 
            statusreport = "Bot latency is high.";
        }
        // else, color remains Colors.Green (0x62de43) and statusreport "Bot latency is normal."

        const uptime = formatUptime(interaction.client.launchTime);
        
        let ownerUser;
        if (OWNER_ID) {
            try {
                ownerUser = await interaction.client.users.fetch(OWNER_ID);
            } catch (error) {
                console.warn("Could not fetch owner user details for ping command footer:", error.message);
                ownerUser = null;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("Comet")
            .setDescription(statusreport)
            .setColor(color)
            .addFields(
                { name: "Latency", value: `\`${latency}ms\``, inline: true },
                { name: "Latest Github Commit", value: commitTs, inline: true },
                { name: "Uptime", value: `\`${uptime}\``, inline: false }
            );

        if (ownerUser) {
            embed.setFooter({ text: `Created by Waike (${ownerUser.username || 'waikboidev'})`, iconURL: ownerUser.displayAvatarURL() });
        } else {
            embed.setFooter({ text: "Created by Waike (waikboidev)" });
        }

        await interaction.reply({ embeds: [embed] });
    },
};