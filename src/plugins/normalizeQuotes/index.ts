/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MessageObject } from "@api/MessageEvents";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const enum CleanScope {
    Everywhere = "everywhere",
    OnlyInCode = "only_in_code"
}

const settings = definePluginSettings({
    scope: {
        type: OptionType.SELECT,
        description: "Where to normalize smart punctuation and quotes",
        options: [
            {
                label: "Everywhere in sent messages",
                value: CleanScope.Everywhere,
                default: true
            },
            {
                label: "Only inside codeblocks and inline code",
                value: CleanScope.OnlyInCode
            }
        ]
    },
    fixQuotes: {
        type: OptionType.BOOLEAN,
        description: "Replace curly quotes (“ ” „ « » ‘ ’) with standard straight ASCII quotes (\" and ')",
        default: true
    },
    fixDashes: {
        type: OptionType.BOOLEAN,
        description: "Replace typographical dashes (— and –) before flags with standard hyphens (-- and -)",
        default: true
    },
    fixSpaces: {
        type: OptionType.BOOLEAN,
        description: "Replace non-breaking spaces (U+00A0) with standard spaces",
        default: true
    },
    suppressInEdits: {
        type: OptionType.BOOLEAN,
        description: "Also normalize quotes when editing existing messages",
        default: true
    }
});

function cleanFragment(str: string): string {
    let res = str;

    if (settings.store.fixQuotes) {
        res = res.replace(/[“”„«»]/g, "\"");
        res = res.replace(/[‘’‚‹›]/g, "'");
    }

    if (settings.store.fixDashes) {
        res = res.replace(/—(?=[a-zA-Z0-9\-])/g, "--");
        res = res.replace(/–(?=[a-zA-Z0-9])/g, "-");
    }

    if (settings.store.fixSpaces) {
        res = res.replace(/\u00A0/g, " ");
    }

    return res;
}

export function normalizePunctuation(text: string): string {
    if (settings.store.scope === CleanScope.Everywhere) {
        return cleanFragment(text);
    }

    const parts = text.split(/(```[\s\S]*?```|`[^`\n]*?`)/g);
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return cleanFragment(part);
        }
        return part;
    }).join("");
}

export default definePlugin({
    name: "NormalizeQuotes",
    description: "Automatically converts curly 'smart quotes', typographical dashes, and non-breaking spaces to standard ASCII",
    authors: [Devs.xxnetme],
    tags: ["Chat", "Utility"],

    settings,

    cleanMessage(msg: MessageObject) {
        msg.content = normalizePunctuation(msg.content);
    },

    onBeforeMessageSend(_, msg) {
        this.cleanMessage(msg);
    },

    onBeforeMessageEdit(_cid, _mid, msg) {
        if (!settings.store.suppressInEdits) return;
        this.cleanMessage(msg);
    }
});
