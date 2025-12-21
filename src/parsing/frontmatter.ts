import { parseYaml } from "obsidian";

import { type CbxConfig, CbxConfigValidator } from "src/config";


export interface CbxConfigSuccess {
    isError: false;
    config: CbxConfig;
}

export interface CbxConfigError {
    isError: true;
    errorList: string[];
}

export type CbxConfigResult = CbxConfigSuccess | CbxConfigError;

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
