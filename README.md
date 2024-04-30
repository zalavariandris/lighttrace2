# lighttrace2
an interactive 2D light simulator


## demo
https://zalavariandris.github.io/lighttrace2/

## todo
- [x] grab and move shapes by their actuals shapes instead of a manipulator
- [x] refactor scene.js classes to seperate files
- [x] set light intensity to compensate light samples per frame
- [x] select shapes (and deselect shapes when clicking on the background)
- [x] inspector panel. 
- [x] display material in viewport
- [x] toolbar: create new shapes and lightsources from toolbar
- [x] delete selected objects

- [x] get rid of Point Manipulator
- [x] DirectionalLight width manipulator.
- [x] Circle shape radius manipulator

- [x] remove class Object like Point from constructors. Use Cx, Cy for example.
- [x] refactor constructors to accept {key value objects}
- [x] mousetools to create scene objects
- [x] rewrite mousetools to a single mouseDown function. to keep track dragStartPosition.
- [x] fix selection when when scene updates.
- [x] refactor SVGViewport to accept children components, to populate the scene

- [x] add ReferencePoint and referenceOffset ot ManipulatorEvent, to simplify grabbing objects
- [x] seperate model from viewmodel, by switching _scene_ to PlainJavascriptObject
- [x] rewrite Shape modelViews to independent Editable SVG Element components.

- [x] support light source intensity (in model)
- [x] support light source intensity with svgViewport
- [x] support light source intensity (in GLviewport)

- [x] support light frequency (model)
- [x] support light frequency with SVGViewport
- [x] support light frequency (in GLViewport)
- [x] use RGB color instead of a single frequency or spectral distribution (for now)
- [x] spectral color support
- [x] show manipulators only when object is selected.
- [x] pull modell from App Component
- [x] factor out mouseTools
- [x] dispersion! (Sellmeier equation)

- [ ] rectangle selection, middlemouse for pan
- [ ] persistent display options
- [ ] ? refactor _sceneObject_ to ECS entity
- [ ] hitTest and raytrace on the GPU


- [x] add new drag handler to SVGViewport
- [ ] refactor GLViewport, and lift the rendering code to a child "entity" component.
- [ ] use redux for UI View models?
- [ ] refactor UI to reusable widgets and ModelViews. Like SVGViewport and SVG Panel?

- [ ] check if webgl extensions are supported by the platform. eg: float texturtres, and half float textures

- [ ] simulate light as wave
- [ ] rotate shapes



### fix known bugs:
- [x] leaks pointlight inside a circle (since rewrite) FIXED: compareHitPoint distances in raytrace.js
- [x] fix transparent material refrection on exit
- [x] fix concave lens ray intersections
- [x] fix pan and zoom with omusetools
- [x] cant select LaserLight
- [ ] rectangle corners leaking: fix linesegment corners hitTest
- [ ] cant use manipulators under shapes: fix svg layering and interaction
- [ ] Lens svg path is not conitonous (when selected its obvious)
- [x] fix LineSegment surfaceNormal and Rectangle surface normals.
- [x] fix selection when scene has changed -> unifiedScenemodel with selection
- [x] fix (potential) memory leak on long simulations.
  - [x] stop refining(rendering) after a number of samples!
- [x] concave lens inner corner does not refract properly
- [ ] when lens thickness is larger then the diameter, visuals are not in sync with the model. These lenses are not traditional lenses, so constrain the model itself. dont let thicknes to be wider then the lens diameter.



# inspiration
https://benedikt-bitterli.me/tantalum/