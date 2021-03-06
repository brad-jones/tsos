import { fs } from 'mz';
import * as shell from 'shelljs';
import { TsOsCompiler } from '@brad-jones/tsos-compiler';
import { InsertReflectableDecorator } from '@brad-jones/tsos-visitors';
import { Expect, Test, AsyncSetupFixture, TeardownFixture } from "alsatian";
import { ModuleResolutionKind, ScriptTarget } from 'typescript';

export class InsertReflectableDecoratorFixture
{
    private transpiledJs: string;

    @AsyncSetupFixture
    public async CompileTypeScript()
    {
        let compiler = new TsOsCompiler();
        await compiler.ConfigureAst
        ({
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            target: ScriptTarget.ES2017,
            moduleResolution: ModuleResolutionKind.NodeJs
        });
        await compiler.AddAstVisitors([InsertReflectableDecorator]);
        compiler.AddSrcFiles([`${__dirname}/ExampleClass.ts`]);
        let diag = (await compiler.Emit()).getDiagnostics();
        if (diag.length > 0) throw diag;
        this.transpiledJs = await fs.readFile(`${__dirname}/ExampleClass.js`, 'utf8');
    }

    @Test()
    public EnsureDecoratorsAndMetadataResourcesHaveBeenEmitted()
    {
        Expect(this.transpiledJs).toContain('tsosReflectable');
        Expect(this.transpiledJs).toContain('__decorate');
        Expect(this.transpiledJs).toContain('__metadata');
    }

    @Test()
    public ClassShouldBeDecorated()
    {
        Expect(this.transpiledJs).toContain('ExampleClass = __decorate');
    }

    @Test()
    public InstancePropertiesShouldBeDecorated()
    {
        Expect(this.transpiledJs).toContain('ExampleClass.prototype, "Baz"');
    }

    @Test()
    public StaticPropertiesShouldBeDecorated()
    {
        Expect(this.transpiledJs).toContain('ExampleClass, "BazStatic"');
    }

    @Test()
    public InstanceMethodsShouldBeDecorated()
    {
        Expect(this.transpiledJs).toContain('ExampleClass.prototype, "Foo"');
    }

    @Test()
    public StaticMethodsShouldBeDecorated()
    {
        Expect(this.transpiledJs).toContain('ExampleClass, "FooStatic"');
    }

    @TeardownFixture
    public DeleteCompiledJavascript()
    {
        shell.rm('-f', `${__dirname}/*.js`);
    }
}
