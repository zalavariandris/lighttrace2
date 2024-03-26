class Material{
    constructor(key)
    {
        this.key = key
    }

    copy()
    {
        return new Material(this.key)
    }

    sample(V, N)
    {
        return null;
    }
}

export default Material;