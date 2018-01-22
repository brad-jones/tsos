import * as ts from 'typescript';
import { IAstVisitor } from '@brad-jones/tsos-compiler';
import { TypeGuards, PropertyDeclaration, GetAccessorDeclaration, SetAccessorDeclaration } from 'ts-simple-ast';

export function ClassDecorator(target: any){}
export function PropertyDecorator(target: any, propertyKey: string | symbol){}
export function MethodDecorator(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>){}

let InsertReflectableDecorator: IAstVisitor = (ast) =>
{
    ast.getSourceFiles().filter(_ => !_.getFilePath().includes('.d.ts')).forEach(srcFile =>
    {
        let addedDecorator = false;

        srcFile.getClasses().forEach(classDec =>
        {
            if (classDec.getDecorators().length === 0)
            {
                classDec.addDecorator({ name: 'tsosReflectable.ClassDecorator' });
                addedDecorator = true;
            }

            let getterAndSetters: string[] = [];
            classDec.getStaticProperties().concat(classDec.getInstanceProperties() as PropertyDeclaration[]).forEach(propDec =>
            {
                // NOTE: Typescript will complain if we add a decorator to both getter and setter.
                if (TypeGuards.isGetAccessorDeclaration(propDec) || TypeGuards.isSetAccessorDeclaration(propDec))
                {
                    if (getterAndSetters.includes(propDec.getName())) return;
                    getterAndSetters.push(propDec.getName());
                }

                if (propDec.getDecorators().length === 0)
                {
                    propDec.addDecorator({ name: 'tsosReflectable.PropertyDecorator' });
                    addedDecorator = true;
                }
            });

            classDec.getStaticMethods().concat(classDec.getInstanceMethods()).forEach(methodDec =>
            {
                if (methodDec.getDecorators().length === 0)
                {
                    methodDec.addDecorator({ name: 'tsosReflectable.MethodDecorator' });
                    addedDecorator = true;
                }
            });
        });

        if (addedDecorator)
        {
            srcFile.addImportDeclaration
            ({
                namespaceImport: 'tsosReflectable',
                moduleSpecifier: '@brad-jones/tsos-visitors'
            });
        }
    });
};

export default InsertReflectableDecorator;
