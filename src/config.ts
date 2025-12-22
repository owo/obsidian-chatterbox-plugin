import { TinyColor } from "@ctrl/tinycolor";
import * as zod from "zod/v4-mini";
import { CSS_LENGTH_STRING_RE } from "./parsing/patterns";


// Config defaults
export const DEFAULT_MODE = "simple";

// TODO: Figure out how to document all Zod objects.

/**
 * Validates a color string. Should be able to accept all valid CSS color strings.
 */
const CssColorStringValidator = zod.pipe(
    zod.coerce.string(),
    zod.transform((val, ctx) => {
        const parsed = new TinyColor(val);

        if (parsed.isValid) {
            return parsed.toHex8String();
        }

        ctx.issues.push({
            code: "custom",  // TODO: Use code "invalid-value" instead.
            message: "Not a valid color value",
            input: val,
        });

        return zod.NEVER;
    })
);

/**
 * Validates a CSS length string. Accepts most useful length units.
 * Notable exceptions are relative viewport and container query length units.
 */
const CssLengthStringValidator = zod.pipe(
    zod.coerce.string(),
    zod.transform((val, ctx) => {
        const trimmed = val.trim();
        const isValid = CSS_LENGTH_STRING_RE.test(trimmed);

        if (isValid) {
            return trimmed;
        }

        ctx.issues.push({
            code: "custom",  // TODO: Use code "invalid-value" instead.
            message: "Not a valid CSS length",
            input: trimmed,
        });

        return zod.NEVER;
    })
);


/**
 * Validates a speaker info entry.
 */
const SpeakerInfoValidator = zod.object({
    bgColor: zod.catch(zod.optional(CssColorStringValidator), undefined),
    fullName: zod.catch(zod.optional(zod.string()), undefined),
    nameColor: zod.catch(zod.optional(CssColorStringValidator), undefined),
    textColor: zod.catch(zod.optional(CssColorStringValidator), undefined),
});

function createOptionalCssLength() {
    return zod.catch(
        zod.optional(CssLengthStringValidator),
        undefined
    );
}

/**
 * Validates an entire Chatterbox config object.
 */
export const CbxConfigValidator = zod.object({
    maxCapsuleWidth: createOptionalCssLength(),
    maxCommentWidth: createOptionalCssLength(),
    maxSpeechWidth: createOptionalCssLength(),
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
