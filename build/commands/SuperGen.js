"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
const fs_extra_1 = require("fs-extra");
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
class Supergen extends standalone_1.BaseCommand {
    // Get required template from the templates folder
    async getTemplate(template) {
        const templatePath = path_1.default.join(__dirname, `../templates/${template}.ejs`);
        console.log(templatePath);
        return await (0, fs_extra_1.readFile)(templatePath, "utf-8");
    }
    // Write the generated content to a file
    async writeToFile(filePath, content) {
        const appRoot = this.application.appRoot;
        return await (0, fs_extra_1.writeFile)(`${appRoot}/${filePath}`, content);
    }
    async run() {
        const string = this.application.helpers.string;
        const resourceName = this.name;
        const resourcePlural = string.pluralize(resourceName);
        const resourceSingular = string.singularize(resourceName);
        const resourceTitleCase = string.capitalCase(resourceSingular);
        const controllerName = `${string.pluralize(resourceTitleCase)}Controller`;
        const modelTemplate = await this.getTemplate("model");
        const migrationTemplate = await this.getTemplate("migration");
        const controllerTemplate = await this.getTemplate("controller");
        const fields = this.fields.map(field => {
            const [name, type] = field.split(":");
            return { name, type };
        });
        // Generate the model
        const modelContent = ejs_1.default.render(modelTemplate, {
            model: resourceTitleCase,
            fields,
        });
        await this.writeToFile(`app/Models/${resourceTitleCase}.ts`, modelContent);
        // Generate the controller
        const controllerContent = ejs_1.default.render(controllerTemplate, {
            resourceController: controllerName,
            resourcePlural: resourcePlural.toLowerCase(),
            resource: resourceSingular,
            model: resourceTitleCase,
            fields,
        });
        await this.writeToFile(`app/Controllers/Http/${controllerName}.ts`, controllerContent);
        // Generate the migration
        const migrationContent = ejs_1.default.render(migrationTemplate, {
            resourcePlural,
            fields,
        });
        const currentTime = new Date().getTime();
        await this.writeToFile(`database/migrations/${currentTime}_${resourcePlural}.ts`, migrationContent);
        // Generate the views
        const views = ["create", "edit", "list", "show"];
        for (const view of views) {
            const viewTemplate = await this.getTemplate(`views/${view}`);
            const viewContent = ejs_1.default.render(viewTemplate, {
                resourcePlural,
                resource: resourceSingular,
                fields,
            });
            (0, fs_extra_1.ensureDirSync)(`resources/views/${resourcePlural}`);
            await this.writeToFile(`resources/views/${resourcePlural}/${view}.edge`, viewContent);
        }
        // Append the routes to the routes file
        const routesFile = await (0, fs_extra_1.readFile)("start/routes.ts", "utf-8");
        const routes = `
    Route.get('${resourcePlural}', '${controllerName}.list').as('${resourcePlural}.list')
    Route.get('${resourcePlural}/create', '${controllerName}.create').as('${resourcePlural}.create')
    Route.post('${resourcePlural}', '${controllerName}.store').as('${resourcePlural}.store')
    Route.get('${resourcePlural}/:id', '${controllerName}.show').as('${resourcePlural}.show')
    Route.get('${resourcePlural}/:id/edit', '${controllerName}.edit').as('${resourcePlural}.edit')
    Route.post('${resourcePlural}/:id', '${controllerName}.update').as('${resourcePlural}.update')
    `;
        const updatedRoutesFile = routesFile + routes;
        await this.writeToFile("start/routes.ts", updatedRoutesFile);
    }
}
Supergen.commandName = "supergen";
Supergen.description = "Creates models, views, controllers, routes and migrations for a resource";
Supergen.settings = {
    loadApp: true,
    stayAlive: false,
};
exports.default = Supergen;
__decorate([
    standalone_1.flags.string({ description: "Name of the resource" }),
    __metadata("design:type", String)
], Supergen.prototype, "name", void 0);
__decorate([
    standalone_1.flags.array({ description: "List of fields" }),
    __metadata("design:type", Array)
], Supergen.prototype, "fields", void 0);
