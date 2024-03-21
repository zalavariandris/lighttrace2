const h = React.createElement;

class Draggable extends React.Component
{
    constructor({...props})
    {
        super(props);
        this.isDragging= false;
        this.prevX= 0;
        this.prevY= 0;

        this.ref = React.createRef()
    }
    
    handleMouseDown(event)
    {
        this.isDragging = false,
        this.prevX = event.clientX,
        this.prevY = event.clientY

        this.handleMouseMove = (event)=>{
            if(!this.isDragging)
            {
                console.log("add click ignore")
                window.addEventListener("click", (e)=>{
                    e.preventDefault();
                    e.stopPropagation();
                }, {capture: true, once: true});
            }
            this.isDragging = true;
            let svg = event.target.closest("SVG")
            function mapScreenToScene({x, y})
            {
                let mousepos = svg.createSVGPoint();
                mousepos.x = x; 
                mousepos.y = y; 
                const scenePos = mousepos.matrixTransform(svg.getScreenCTM().inverse());
                return scenePos
            }


                let mousepos = svg.createSVGPoint();
                mousepos.x = event.clientX; 
                mousepos.y = event.clientY; 
                mousepos = mousepos.matrixTransform(svg.getScreenCTM().inverse());
    
                let prevmousepos = svg.createSVGPoint();
                prevmousepos.x = this.prevX;
                prevmousepos.y = this.prevY;
                prevmousepos = prevmousepos.matrixTransform(svg.getScreenCTM().inverse());
    
                const dx = mousepos.x-prevmousepos.x;
                const dy = mousepos.y-prevmousepos.y;
                

                this.prevX=event.clientX,
                this.prevY=event.clientY
                this.props.onDrag(event, dx, dy);

            this.prevX = event.clientX
            this.prevY = event.clientY
        }

        this.handleMouseUp = (event)=>{
            event.stopPropagation();
            event.preventDefault(); // prevent text selection when dragging
    
            window.removeEventListener("mousemove", this.handleMouseMove)
            window.removeEventListener("mouseup", this.handleMouseUp)


            this.isDragging = false;
        }

        window.addEventListener("mousemove", this.handleMouseMove, false);
        window.addEventListener("mouseup", this.handleMouseUp, false);
        
        // window.addEventListener("click", this.handleMouseClick, true);
        // window.addEventListener ('click', this.ignore_click, true ); 
        event.preventDefault(); // prevent text selection when dragging
        event.stopPropagation();
        return false;
    }

    render()
    {
        return h('g', { 
            ref: this.ref,
            onMouseDown: (e) => this.handleMouseDown(e),
            ...this.props
        },
            h('g', null,
                this.props.children
            )
        );
    }  
}
