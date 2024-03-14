
function h(tag, attributes = {}, ...children) {
    // Check if children is not provided or is an empty array
    if (!children.length) {
        return {
            tag: tag,
            attributes: attributes || {},
            children: []
        };
    } else {
        return {
            tag: tag,
            attributes: attributes || {},
            children: children
        };
    }
}

function render(vNode, isSVG=false)
{
    /*
    render a virtual node tree to a real document node
    vNode: hyperscript
    isSVG: if the vnode is an svg element.  (this is handled automatically. if the tag is svg. this flag fill be set down the line)
    returns documentNode
    */
    if(typeof vNode === 'string')
    {
        return document.createTextNode(vNode);
    }
    else
    {

        let node = null;
        if(vNode.tag == "svg" || isSVG){
            node = document.createElementNS('http://www.w3.org/2000/svg', vNode.tag);
            isSVG=true;
        }else{
            node = document.createElement(vNode.tag);
        }

        for (const attr in vNode.attributes) {
            if (vNode.attributes.hasOwnProperty(attr))
            {
                const value = vNode.attributes[attr];
                if(typeof value === 'boolean')
                {
                    if(value == true) node.setAttribute(attr, "");
                }else{
                    node.setAttribute(attr, value);
                }
                
            }
        }

        vNode.children.forEach(vChild => {
            const childNode = render(vChild, isSVG)
            node.appendChild(childNode)
        });
        return node;
    }
}

function patch(parent, node, vNode, isSVG=false)
{
    /*
    Patch a document node to match the virtual node.
    parent: parent node
    node: current text or element
    vNode: target hperscript
    returns: nothing.
    */

    // new node is null remove old node
    if(node && !vNode){
        parent.removeChild(node)
    }

    // if old node is null, append the new node
    else if(!node && vNode)
    {
        parent.appendChild(render(vNode, isSVG))
    }

    // old node and new node are nodes
    else if(node && vNode)
    {
        /* Handle TEXT nodes */
        // if both nodes are text update text if necessary
        if(node.nodeType == Node.TEXT_NODE && typeof vNode == 'string')
        {
            // if node value is different to vNode string than render the vNode's string to a TextNode
            if(node.nodeValue != vNode)
            {
                node.replaceWith(render(vNode, isSVG))
            }
        }
        // oldnode is text and new node is element, then replace old node
        else if(node.nodeType == Node.TEXT_NODE && vNode.hasOwnProperty("tag"))
        {
            node.replaceWith(render(vNode, isSVG))
        }

        // oldnode is element and new node is text, then replace old node
        else if(node.nodeType == Node.ELEMENT_NODE && typeof vNode == 'string')
        {
            node.replaceWith(render(vNode, isSVG))
        }

        /* Handle ELEMENT nodes */
        // when both nodes are elements
        else if(node.nodeType == Node.ELEMENT_NODE && vNode.hasOwnProperty("tag"))
        {
            // if new node has a different tag, replace old node
            if(node.nodeName!=vNode.tag.toUpperCase())
            {
                node.replaceWith(render(vNode, isSVG))
            }
            else
            {
        
                // patch attributes
                console.log("Patch attributes")
                const node_attributes = Object.fromEntries(Array(...node.attributes).map((attr,i)=>[attr.name, attr.value]))
                const nodeKeys = new Set(Object.keys(node_attributes));
                const vNode_attributes = vNode.attributes;
                const vNodeKeys = new Set(Object.keys(vNode_attributes));

                const removed_attributes = nodeKeys.difference(vNodeKeys);
                const added_attributes = vNodeKeys.difference(nodeKeys);
                const kept_attributes = nodeKeys.intersection(vNodeKeys);

                console.log("- node_attributes:   ", node_attributes)
                console.log("- vNode_attributes:  ", vNode_attributes)
                console.log("- removed_attributes:", removed_attributes)
                console.log("- added_attributes:  ", added_attributes)
                console.log("- kept attributes:   ", kept_attributes)

                for(let name of removed_attributes)
                {
                    node.removeAttribute(name)
                }

                for(let name of added_attributes)
                {
                    const newValue = vNode.attributes[name];
                    if(newValue == true || newValue == "true")
                    {
                        node.setAttribute(name, "")
                    }
                    else if(newValue == false || newValue == "false")
                    {
                        // dont add attribute
                    }
                    else
                    {
                        node.setAttribute(name, newValue)
                    }
                }

                for(let name of kept_attributes)
                {
                    console.log("update attribute", name)
                    const newValue = vNode.attributes[name];
                    if(newValue == true || newValue == "true")
                    {
                        node.setAttribute(name, "")
                    }
                    else if(newValue == false || newValue == "false")
                    {
                        node.removeAttribute(name)
                    }
                    else if(node_attributes[name]!=newValue)
                    {
                        node.setAttribute(name, vNode.attributes[name])
                    }
                }

                // patch children
                const count = Math.max(node.childNodes.length, vNode.children? vNode.children.length : 0);

                for(let i=0; i<count; i++)
                {
                    patch(node, node.childNodes[i], vNode.children[i], isSVG)
                }
            }
        }
    }


}


export {h, render, patch};
export default {h, render, patch};