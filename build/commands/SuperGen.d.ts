import { BaseCommand } from "@adonisjs/core/build/standalone";
export default class Supergen extends BaseCommand {
    static commandName: string;
    static description: string;
    static settings: {
        loadApp: boolean;
        stayAlive: boolean;
    };
    name: string;
    fields: string[];
    getTemplate(template: string): Promise<string>;
    writeToFile(filePath: string, content: string): Promise<void>;
    run(): Promise<void>;
}
