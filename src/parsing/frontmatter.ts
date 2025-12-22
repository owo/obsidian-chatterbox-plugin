import { parseYaml } from "obsidian";

import { type CbxConfig, CbxConfigValidator } from "src/config";


/**
 * Returned by {@link parseCbxFrontmatter} when frontmatter is valid YAML.
 * The `config` property contains the parsed Chatterbox configuration.
 */
export interface CbxConfigSuccess {
    isError: false;
    config: CbxConfig;
}

/**
 * Returned by {@link parseCbxFrontmatter} when frontmatter is not valid YAML.
 * The `errorList` property contains a list of error messages corresponding to each error detected.
 */
export interface CbxConfigError {
    isError: true;
    errorList: string[];
}

export type CbxConfigResult = CbxConfigSuccess | CbxConfigError;

/**
 * Parses and validates Chatterbox frontmatter YAML.
 * 
 * @param source Frontmatter source to parse.
 * @returns A {@link CbxConfigSuccess} instance if source is valid YAML,
 *          a {@link CbxConfigError} instance otherwise.
 */
export function parseCbxFrontmatter(source: string): CbxConfigResult {
    let fmParsed: unknown = null;

    try {
        fmParsed = parseYaml(source);
    }
    catch {
        const errorOut: CbxConfigError = {
            isError: true,
            errorList: [
                "Frontmatter is not valid YAML."
            ],
        };

        return errorOut;
    }

    const fmValidated = CbxConfigValidator.safeParse(fmParsed);

    if (fmValidated.success) {
        return {
            isError: false,
            config: fmValidated.data as unknown as CbxConfig,
        };
    }
    else {
        const errorList: string[] = [];

        for (const issue of fmValidated.error.issues) {
            const errorPath = issue.path.join(" → ");
            const errorItem = `${issue.message} @ ${errorPath}`;
            errorList.push(errorItem);
        }

        return {
            isError: true,
            errorList,
        }
    }
}
