import React from "react"

class Draggable extends React.Component
{
    constructor({...props})
    {
        super(props);
        this.state = {
            isDragging: false,
            prevX: 0,
            prevY: 0
        }

        this.ref = React.createRef()
    }
    
    handleMouseDown(event)
    {
        this.setState({
            isDragging: false,
            prevX: event.clientX,
            prevY: event.clientY
        })

        this.handleMouseMove = (event)=>{
            let svg = event.target.closest("SVG")
            
            // Get point in global SVG space
            function cursorPoint(evt)
            {
                pt.x = evt.clientX; pt.y = evt.clientY;
                return 
            }

            this.setState({
                isDragging: true,
                prevX: event.clientX,
                prevY: event.clientY
            })
    
            if (this.state.isDragging)
            {
                let mousepos = svg.createSVGPoint();
                mousepos.x = event.clientX; 
                mousepos.y = event.clientY; 
                mousepos = mousepos.matrixTransform(svg.getScreenCTM().inverse());
    
                let prevmousepos = svg.createSVGPoint();
                prevmousepos.x = this.state.prevX;
                prevmousepos.y = this.state.prevY;
                prevmousepos = prevmousepos.matrixTransform(svg.getScreenCTM().inverse());
    
                const dx = mousepos.x-prevmousepos.x;
                const dy = mousepos.y-prevmousepos.y;
                
                this.setState({
                    prevX: event.clientX,
                    prevY: event.clientY
                })
                this.props.onDrag(event, dx, dy);
            }
        }

        this.handleMouseUp = (event)=>{
            event.stopPropagation();
            event.preventDefault(); // prevent text selection when dragging
    
            window.removeEventListener("mousemove", this.handleMouseMove)
            window.removeEventListener("mouseup", this.handleMouseUp)
            window.setTimeout(()=>{
                this.setState({"isDragging": false})
            }, 1)
        }

        this.handleClick = (event)=>{
            
            if(this.state.isDragging)
            {
                console.log("ignore click")
                event.stopPropagation()
            }else{
                this.props.onClick(event)
            }
        }
        
        window.addEventListener("mousemove", this.handleMouseMove, false);
        window.addEventListener("mouseup", this.handleMouseUp, false);
        window.addEventListener("click", this.handleClick, true);
        // window.addEventListener("click", this.handleMouseClick, true);
        // window.addEventListener ('click', this.ignore_click, true ); 
        event.preventDefault(); // prevent text selection when dragging
        event.stopPropagation();
        return false;
    }

    render()
    {
        const h = React.createElement;
        return h('g', { 
            // className: 'draggable',
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

export default Draggable