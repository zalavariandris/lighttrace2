import React from "react"

class Draggable extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            isDragging: false,
            prevX: 0,
            prevY: 0
        }
    }
    
    handleMouseDown(event)
    {
        this.setState({
            isDragging: true,
            prevX: event.clientX,
            prevY: event.clientY
        })
        
        window.addEventListener("mousemove", (e)=>this.handleMouseMove(e));
        window.addEventListener("mouseup", (e)=>this.handleMouseUp(e));
        event.preventDefault(); // prevent text selection when dragging
        event.stopPropagation();
    }
    
    handleMouseUp(event)
    {
        this.setState({"isDragging": false})
        // event.stopPropagation();
    }
    
    handleMouseMove(event)
    {
        let svg = event.target.closest("SVG")
        
        // Get point in global SVG space
        function cursorPoint(evt){
            pt.x = evt.clientX; pt.y = evt.clientY;
            return 
        }

        if (this.state.isDragging) {
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
                prevY: event.clientY,
                // x: this.state.x+dx,
                // y: this.state.y+dy
            })
            this.props.onDrag(event, dx, dy);
        }
        // event.stopPropagation();
    }
    
    render()
    {
        const h = React.createElement;
        return h('g', { className: 'draggable', onMouseDown: (e) => this.handleMouseDown(e) },
            h('g', null,
                this.props.children
            )
        );
    }  
}

export default Draggable