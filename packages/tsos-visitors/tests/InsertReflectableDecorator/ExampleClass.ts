class ExampleClass
{
    public constructor(foo: string, bar: number)
    {

    }

    public get Baz(): string
    {
        return 'baz';
    }

    public set Baz(value: string)
    {
        console.log(value);
    }

    public static get BazStatic(): string
    {
        return 'baz';
    }

    public static set BazStatic(value: string)
    {
        console.log(value);
    }

    public Foo(bar: string): object
    {
        return {};
    }

    public static FooStatic(bar: string): object
    {
        return {};
    }
}
