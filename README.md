# supergen

If "make" command was a superhero.

## Install

1. ``npm i @weskerjs/supergen``
2. Add ``"@weskerjs/supergen/build/commands"`` to the commands array in  ``.adonisrc.json``  
3. Run ``node ace generate:manifest``  

## Example  

```bash
node ace supergen --name cars --fields=manufacturer:string,model:string,colour:string
```

This will generate the following:

- Create, Show, Edit and List views inside ``views/cars`` directory  
- CarsController
- Car model
- [timestamp]_cars.ts migration.

It will also append CRUD routes to the end of ``start/routes.ts``  

Ensure the resource name is in lowercase or you'll run into some issues in the Controller file.


