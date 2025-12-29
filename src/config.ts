import * as zod from "zod/v4-mini";

zod.config(zod.locales.en());

export const ChatterboxModes = ["bubble", "simple"] as const;
export type CbxMode = typeof ChatterboxModes[number];

// Config defaults
export const DEFAULT_AUTO_COLOR_NAMES: boolean = true;
export const DEFAULT_MODE: CbxMode = "bubble";

// TODO: Figure out how to document all Zod objects.

/**
 * Validates a author info entry.
 */
const AuthorInfoValidator = zod.object({
    bgColor: zod.catch(zod.optional(zod.string()), undefined),
    fullName: zod.catch(zod.optional(zod.string()), undefined),
    nameColor: zod.catch(zod.optional(zod.string()), undefined),
    textColor: zod.catch(zod.optional(zod.string()), undefined),
});

/**
 * Validates an entire Chatterbox config object.
 */
export const CbxConfigValidator = zod.object({
    autoColorNames: zod.catch(zod.optional(zod.boolean()), undefined),
    chatterboxId: zod.catch(zod.optional(zod.string()), undefined),
    maxCapsuleWidth: zod.catch(zod.optional(zod.string()), undefined),
    maxCommentWidth: zod.catch(zod.optional(zod.string()), undefined),
    maxMessageWidth: zod.catch(zod.optional(zod.string()), undefined),
    mode: zod.catch(zod.optional(zod.enum(ChatterboxModes)), undefined),
    authors: zod.catch(
        zod.optional(zod.record(zod.string(), AuthorInfoValidator)),
        undefined,
    ),
});

export type AuthorInfo = zod.infer<typeof AuthorInfoValidator>;

export type CbxConfig = zod.infer<typeof CbxConfigValidator>;
