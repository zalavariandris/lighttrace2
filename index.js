const model = {
    scene: [],
    raytrace: {
        maxBounce: 5
    }
}

function copy(obj)
{
    return obj;
}

function update(msg, model)
{
    const newModel = copy(model);
    switch(msg.action){
        case "setMaxBounce":
            newModel.maxBounce = msg.value;
            break;
    }
    return newModel;
}

function view(model)
{
    return { 
        element: "div", children: [
            {element: "svg", children: [
                
            ]},
            {element: "canvas", children: []}
        ]
    }
}

class App{
    constructor(model, view, update)
    {
        this.model = model;
        this.view = view;
        this.update = update;
        this.current_view = {}
    }

    patch()
    {
        const new_view = this.view();

        // update element:
        if(new_view.type != this.current_view.type){
            new_view.element.remove();
            new_view.element.createElement(new_view.type);
        }else{
            
        }


    }
}