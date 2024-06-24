import { BaseCommand, flags } from "@adonisjs/core/build/standalone";

import { ensureDirSync, readFile, writeFile } from "fs-extra";
import ejs from "ejs";
import path from "path";

export default class Supergen extends BaseCommand {
  public static commandName = "supergen";
  public static description = "Creates models, views, controllers, routes and migrations for a resource";

  public static settings = {
    loadApp: true,
    stayAlive: false,
  };

  @flags.string({ description: "Name of the resource" })
  public name: string;

  @flags.array({ description: "List of fields" })
  public fields: string[];

  // Get required template from the templates folder
  public async getTemplate(template: string) {
    const templatePath = path.join(__dirname, `../templates/${template}.ejs`);
    console.log(templatePath);
    return await readFile(templatePath, "utf-8");
  }

  // Write the generated content to a file
  public async writeToFile(filePath: string, content: string) {
    const appRoot = this.application.appRoot;
    return await writeFile(`${appRoot}/${filePath}`, content);
  }

  public async run() {
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
    const modelContent = ejs.render(modelTemplate, {
      model: resourceTitleCase,
      fields,
    });

    await this.writeToFile(`app/Models/${resourceTitleCase}.ts`, modelContent);

    // Generate the controller
    const controllerContent = ejs.render(controllerTemplate, {
      resourceController: controllerName,
      resourcePlural: resourcePlural.toLowerCase(),
      resource: resourceSingular,
      model: resourceTitleCase,
      fields,
    });

    await this.writeToFile(`app/Controllers/Http/${controllerName}.ts`, controllerContent);

    // Generate the migration
    const migrationContent = ejs.render(migrationTemplate, {
      resourcePlural,
      fields,
    });

    const currentTime = new Date().getTime();
    await this.writeToFile(`database/migrations/${currentTime}_${resourcePlural}.ts`, migrationContent);

    // Generate the views
    const views = ["create", "edit", "list", "show"];

    for (const view of views) {
      const viewTemplate = await this.getTemplate(`views/${view}`);
      const viewContent = ejs.render(viewTemplate, {
        resourcePlural,
        resource: resourceSingular,
        fields,
      });

      ensureDirSync(`resources/views/${resourcePlural}`);
      await this.writeToFile(`resources/views/${resourcePlural}/${view}.edge`, viewContent);
    }

    // Append the routes to the routes file
    const routesFile = await readFile("start/routes.ts", "utf-8");

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
