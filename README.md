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

- [ ] move animation, iterative rendering to the GLViewport component

- [ ] support light frequency
- [ ] support light distribution

- [x] refactor SVGViewport to accept children components, to populate the scene

- [ ] support light source intensity
- [ ] simulate light as wave

- [ ] ? refactor _sceneObject_ to sceneObject({shape, material})

### fix known bugs:
- [x] leaks pointlight inside a circle (since rewrite) FIXED: compareHitPoint distances in raytrace.js
- [x] fix transparent material refrection on exit
- [x] fix concave lens ray intersections
- [ ] rectangle corners leaking: fix linesegment corners hitTest
- [ ] cant use manipulators under shapes: fix svg layering and interaction
- [ ] rotate shapes
- [x] fix selection when scene has changed -> unifiedScenemodel with selection
- [ ] fix (potential) memory leak on long simulations.
  - [ ] stop refining(rendering) after a number of samples!
- [ ] concave lens inner corner does not refract properly
- [ ] when lens thickness is larger then the diameter, visuals are not in sync with the model. These lenses are not traditional lenses, so constrain the model itself. dont let thicknes to be wider then the lens diameter.



