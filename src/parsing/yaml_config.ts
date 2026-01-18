import { parseYaml } from "obsidian";

import { type ChatterboxConfig, ChatterboxConfigValidator } from "src/config";


/**
 * Returned by {@link parseYamlConfig} when configuration source is valid YAML.
 * The `config` property contains the parsed Chatterbox configuration.
 */
export interface ConfigSuccess {
    isError: false;
    config: ChatterboxConfig;
}

/**
 * Returned by {@link parseYamlConfig} when configuration source is not valid YAML.
 * The `errorList` property contains a list of error messages corresponding to each error detected.
 */
export interface ConfigError {
    isError: true;
    errorList: string[];
}

export type ConfigResult = ConfigSuccess | ConfigError;

/**
 * Parses and validates Chatterbox configuration YAML.
 * 
 * @param source Configuration source to parse.
 * @returns A {@link ConfigSuccess} instance if source is valid YAML,
 *          a {@link ConfigError} instance otherwise.
 */
export function parseYamlConfig(source: string): ConfigResult {
    let fmParsed: unknown = null;

    try {
        fmParsed = parseYaml(source);
    }
    catch {
        const errorOut: ConfigError = {
            isError: true,
            errorList: [
                "Configuration is not valid YAML."
            ],
        };

        return errorOut;
    }

    const fmValidated = ChatterboxConfigValidator.safeParse(fmParsed);

    if (fmValidated.success) {
        return {
            isError: false,
            config: fmValidated.data as unknown as ChatterboxConfig,
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
        };
    }
}
