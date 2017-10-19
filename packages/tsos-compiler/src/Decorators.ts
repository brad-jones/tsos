/**
 * Declare a class that implements both static and instance interfaces.
 *
 * @see https://github.com/Microsoft/TypeScript/issues/13462#issuecomment-295685298
 *
 * > TODO: This really belongs in it's very own package I think.
 */
export function Implements<T>()
{
    return (constructor: T) => {}
}
