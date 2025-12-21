import { TinyColor } from "@ctrl/tinycolor";
import * as zod from "zod/v4-mini";


// Config defaults
export const DEFAULT_MAX_CAPSULE_WIDTH = 80;
export const DEFAULT_MAX_COMMENT_WIDTH = 80;
export const DEFAULT_MAX_SPEECH_WIDTH = 80;
export const DEFAULT_MODE = "simple";


// TODO: Figure out how to document all Zod objects.

/**
 * Validates a color string. Should be able to accept all valid CSS color strings.
 */
const ColorStringValidator = zod.pipe(
    zod.string(),
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
    bgColor: zod.catch(zod.optional(ColorStringValidator), undefined),
    name: zod.catch(zod.optional(zod.string()), undefined),
    nameColor: zod.catch(zod.optional(ColorStringValidator), undefined),
    textColor: zod.catch(zod.optional(ColorStringValidator), undefined),
});


/**
 * Validates a percentage value, clamping it to [0, 100].
 */
const PercentageValidator = zod.pipe(
    zod.number(),
    zod.transform((val) => {
        if (isNaN(val)) {
            return 0;
        }

        return Math.clamp(val, 0, 100);
    })
);

function createPercentage() {
    return zod.catch(
        zod.optional(PercentageValidator),
        undefined
    );
}

/**
 * Validates an entire Chatterbox config object.
 */
export const CbxConfigValidator = zod.object({
    maxCapsuleWidth: createPercentage(),
    maxCommentWidth: createPercentage(),
    maxSpeechWidth: createPercentage(),
    mode: zod.catch(
        zod.optional(zod.enum(["bubble", "simple"])),
        undefined
    ),
    speakers: zod.catch(
        zod.optional(zod.record(zod.string(), SpeakerInfoValidator)),
        undefined,
    ),
});

export type SpeakerInfo = zod.infer<typeof SpeakerInfoValidator>;
export type CbxConfig = zod.infer<typeof CbxConfigValidator>;
