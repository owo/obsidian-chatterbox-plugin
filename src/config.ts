import { TinyColor } from "@ctrl/tinycolor";
import * as zod from "zod";


// Config defaults
const DEFAULT_MAX_CAPSULE_WIDTH = 80;
const DEFAULT_MAX_COMMENT_WIDTH = 80;
const DEFAULT_MAX_MESSAGE_WIDTH = 80;
const DEFAULT_MODE = "simple";

// TODO: Try using Zod Mini to reduce build size
// TODO: Figure out how to document all Zod objects.

/**
 * Validates a color string. Should be able to accept all valid CSS color strings.
 */
const ColorStringValidator = zod.string()
    .pipe(
        zod.transform((val, ctx) => {
            const parsed = new TinyColor(val);

            if (parsed.isValid) {
                return parsed.toHex8String();
            }

            ctx.issues.push({
                code: "custom",
                message: "Not a valid color value",
                input: val,
            });

            return zod.NEVER;
        })
    );

/**
 * Validates a speaker info entry.
 */
const SpeakerInfoValidator = zod.object({
    bgColor: zod.optional(ColorStringValidator)
        .catch(undefined),
    name: zod.optional(zod.string()),
    nameColor: zod.optional(ColorStringValidator)
        .catch(undefined),
    textColor: zod.optional(ColorStringValidator)
        .catch(undefined),
});

/**
 * Validates a percentage value, clamping it to [0, 100].
 */
const PercentageValidator = zod.number()
    .pipe(
        zod.transform((val) => {
            if (isNaN(val)) {
                return 0;
            }

            return Math.clamp(val, 0, 100);
        })
    );

/**
 * Validates an entire Chatterbox config object.
 */
export const CbxConfigValidator = zod.object({
    maxCapsuleWidth: zod.optional(PercentageValidator)
        .catch(DEFAULT_MAX_COMMENT_WIDTH)
        .default(DEFAULT_MAX_CAPSULE_WIDTH),
    maxCommentWidth: zod.optional(PercentageValidator)
        .catch(DEFAULT_MAX_COMMENT_WIDTH)
        .default(DEFAULT_MAX_COMMENT_WIDTH),
    maxSpeechWidth: zod.optional(PercentageValidator)
        .catch(DEFAULT_MAX_MESSAGE_WIDTH)
        .default(DEFAULT_MAX_MESSAGE_WIDTH),
    mode: zod.optional(zod.enum(["bubble", "simple"]))
        .catch(DEFAULT_MODE)
        .default(DEFAULT_MODE),
    speakers: zod.optional(zod.record(zod.string(), SpeakerInfoValidator))
        .catch(() => ({} as Record<string, SpeakerInfo>))
        .default(() => ({} as Record<string, SpeakerInfo>)),
});

export type SpeakerInfo = zod.infer<typeof SpeakerInfoValidator>;
export type CbxConfig = zod.infer<typeof CbxConfigValidator>;
