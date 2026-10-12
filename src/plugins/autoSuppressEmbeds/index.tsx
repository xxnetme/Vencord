/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { MessageObject } from "@api/MessageEvents";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { IconComponent, OptionType } from "@utils/types";
import { useState } from "@webpack/common";

const enum SuppressMode {
    All = "all",
    Blacklist = "blacklist",
    Whitelist = "whitelist"
}

const settings = definePluginSettings({
    mode: {
        type: OptionType.SELECT,
        description: "Which links should have their embeds suppressed",
        options: [
            {
                label: "All Links",
                value: SuppressMode.All,
                default: true
            },
            {
                label: "Blacklist (Only Suppress Specified Domains)",
                value: SuppressMode.Blacklist
            },
            {
                label: "Whitelist (Suppress All EXCEPT Specified Domains)",
                value: SuppressMode.Whitelist
            }
        ]
    },
    domains: {
        type: OptionType.STRING,
        description: "Comma-separated list of domains for Blacklist or Whitelist",
        default: "x.com, twitter.com, tiktok.com, instagram.com, reddit.com",
        hidden: () => settings.store.mode === SuppressMode.All
    },
    ignoreDirectMedia: {
        type: OptionType.BOOLEAN,
        description: "Do not suppress direct links to images and videos (.png, .jpg, .gif, .mp4, etc.) so they still render in chat",
        default: true
    },
    onlyOnMultipleLinks: {
        type: OptionType.BOOLEAN,
        description: "Only suppress embeds when a message contains 2 or more links",
        default: false
    },
    suppressInEdits: {
        type: OptionType.BOOLEAN,
        description: "Also suppress embeds when editing existing messages",
        default: true
    },
    showChatBarButton: {
        type: OptionType.BOOLEAN,
        description: "Show a toggle button in the chat bar to quickly enable/disable embed suppression",
        default: true
    }
});

let isTemporarilyDisabled = false;

const MEDIA_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "mp4", "webm", "mov", "svg"]);

function isDirectMedia(urlStr: string): boolean {
    try {
        const url = new URL(urlStr);
        const ext = url.pathname.toLowerCase().split(".").pop();
        return ext ? MEDIA_EXTENSIONS.has(ext) : false;
    } catch {
        return false;
    }
}

function getDomainList(): string[] {
    return settings.store.domains
        .split(",")
        .map(d => d.trim().toLowerCase())
        .filter(Boolean);
}

function shouldSuppressUrl(urlStr: string): boolean {
    if (settings.store.ignoreDirectMedia && isDirectMedia(urlStr)) {
        return false;
    }

    if (settings.store.mode === SuppressMode.All) {
        return true;
    }

    try {
        const hostname = new URL(urlStr).hostname.toLowerCase();
        const domains = getDomainList();
        const matched = domains.some(d => hostname === d || hostname.endsWith("." + d));

        if (settings.store.mode === SuppressMode.Blacklist) {
            return matched;
        } else if (settings.store.mode === SuppressMode.Whitelist) {
            return !matched;
        }
    } catch {
        return false;
    }

    return false;
}

const URL_REGEX = /(<https?:\/\/[^\s>]+>)|(\[[^\]]*\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<]+[^<.,:;!?'"`\s)\]}])/g;

export function suppressEmbedsInText(content: string): string {
    const parts = content.split(/(```[\s\S]*?```|`[^`\n]*?`)/g);

    if (settings.store.onlyOnMultipleLinks) {
        let count = 0;
        for (let i = 0; i < parts.length; i += 2) {
            const matches = parts[i].matchAll(URL_REGEX);
            for (const m of matches) {
                const bareUrl = m[4];
                if (bareUrl && shouldSuppressUrl(bareUrl)) {
                    count++;
                }
            }
        }
        if (count < 2) return content;
    }

    return parts.map((part, index) => {
        if (index % 2 === 1) return part;

        return part.replace(
            URL_REGEX,
            (match, alreadySuppressed, markdownLink, _mdUrl, bareUrl) => {
                if (alreadySuppressed || markdownLink) {
                    return match;
                }

                if (bareUrl && shouldSuppressUrl(bareUrl)) {
                    return `<${bareUrl}>`;
                }

                return match;
            }
        );
    }).join("");
}

const SuppressEmbedIcon: IconComponent = ({ height = 20, width = 20, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" className={className}>
        <path
            fill="currentColor"
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V5h14v14Zm-2-4H7v-2h10v2Zm0-4H7V9h10v2Z"
        />
    </svg>
);

function SuppressEmbedDisabledIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path
                fill="var(--text-muted)"
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V5h14v14Zm-2-4H7v-2h10v2Zm0-4H7V9h10v2Z"
                opacity="0.4"
            />
            <path fill="var(--status-danger)" d="m21.178 1.707 1.414 1.414L4.121 21.593l-1.414-1.414L21.178 1.707Z" />
        </svg>
    );
}

const AutoSuppressToggle: ChatBarButtonFactory = ({ isMainChat }) => {
    const [enabled, setEnabled] = useState(!isTemporarilyDisabled);

    if (!isMainChat || !settings.store.showChatBarButton) return null;

    return (
        <ChatBarButton
            tooltip={enabled ? "Auto Suppress Embeds: Active" : "Auto Suppress Embeds: Paused"}
            onClick={() => {
                const next = !enabled;
                isTemporarilyDisabled = !next;
                setEnabled(next);
            }}
        >
            {enabled ? <SuppressEmbedIcon /> : <SuppressEmbedDisabledIcon />}
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "AutoSuppressEmbeds",
    description: "Automatically wraps links in <...> to prevent huge unwanted embed previews from cluttering chat",
    authors: [Devs.xxnetme],
    tags: ["Chat", "Utility"],

    settings,

    chatBarButton: {
        icon: SuppressEmbedIcon,
        render: AutoSuppressToggle
    },

    cleanMessage(msg: MessageObject) {
        if (isTemporarilyDisabled) return;
        if (!/https?:\/\//i.test(msg.content)) return;
        msg.content = suppressEmbedsInText(msg.content);
    },

    onBeforeMessageSend(_, msg) {
        this.cleanMessage(msg);
    },

    onBeforeMessageEdit(_cid, _mid, msg) {
        if (!settings.store.suppressInEdits) return;
        this.cleanMessage(msg);
    }
});
