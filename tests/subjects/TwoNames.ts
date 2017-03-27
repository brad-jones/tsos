class TwoNames
{
    private privateName : string = 'John';
    public publicName : string = 'Doe';
}

let example = new TwoNames();

// Without any extra transpilations this will work at runtime.
// When we add in the test visitor this should output undefined.
console.log(example.privateName);
