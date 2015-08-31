

public class A
{
    public A Parent { get; set; }
}

public class B
{
    public A a1 { get; set; }
    public A a2 { get; set; }
    public C c { get; set; }
    public B Parent { get; set; }
}

public class C
{
    public A a1 { get; set; }
    public A a2 { get; set; }
    public C c { get; set; }
    public B Parent { get; set; }
}

public static class Extension
{
    public static void Method(this A @class)
    {
        var parent = @class.Parent;
        var a1 = nameof(B.a1);
        var a2 = nameof(B.a2) + a1;
        var c = nameof(C.c) + a2;
        var b = nameof(B.Parent) + c;
        var d = c + b;
    }

    public static void Method2() {
        new A().Method();
    }
}
