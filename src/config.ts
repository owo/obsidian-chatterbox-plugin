import * as zod from "zod/v4-mini";


zod.config(zod.locales.en());

const _ZOD_STRING_ONLY_ARRAY = zod.pipe(
    zod.array(zod.unknown()),
    zod.transform((arr) => arr.filter((x) => typeof x === "string"))
);

export const CHATTERBOX_MODES = ["base", "bubble", "simple"] as const;

export type ChatterboxMode = typeof CHATTERBOX_MODES[number];

// Config defaults
export const DEFAULT_AUTO_COLOR_AUTHORS: boolean = true;
export const DEFAULT_MODE: ChatterboxMode = "bubble";

/**
 * Validates an author info entry.
 */
const AuthorInfoValidator = zod.object({
    bgColor: zod.catch(zod.optional(zod.string()), undefined),
    authorFull: zod.catch(zod.optional(zod.string()), undefined),
    authorColor: zod.catch(zod.optional(zod.string()), undefined),
    textColor: zod.catch(zod.optional(zod.string()), undefined),
    subtextColor: zod.catch(zod.optional(zod.string()), undefined),
});

/**
 * Validates an entire Chatterbox config object.
 */
export const ChatterboxConfigValidator = zod.object({
    autoColorAuthors: zod.catch(zod.optional(zod.boolean()), undefined),
    classes: zod.catch(
        zod.optional(zod.union([zod.string(), _ZOD_STRING_ONLY_ARRAY])),
        undefined
    ),
    maxCapsuleWidth: zod.catch(zod.optional(zod.string()), undefined),
    maxCommentWidth: zod.catch(zod.optional(zod.string()), undefined),
    minMessageWidth: zod.catch(zod.optional(zod.string()), undefined),
    maxMessageWidth: zod.catch(zod.optional(zod.string()), undefined),
    mode: zod.catch(zod.optional(zod.enum(CHATTERBOX_MODES)), undefined),
    authors: zod.catch(
        zod.optional(zod.record(zod.string(), AuthorInfoValidator)),
        undefined,
    ),
});

export type AuthorInfo = zod.infer<typeof AuthorInfoValidator>;

export type ChatterboxConfig = zod.infer<typeof ChatterboxConfigValidator>;
