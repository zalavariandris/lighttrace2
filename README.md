# lighttrace2
an interactive 2D light simulator

## features
- [ ] 
 
## todo
- [x] grab and move shapes by their actuals shapes instead of a manipulator
- [x] refactor scene.js classes to seperate files
- [x] set light intensity to compensate light samples per frame
- [x] select shapes (and deselect shapes when clicking on the background)
- [x] inspector panel. 
- [x] display material in viewport
- [x] toolbar: create new shapes and lightsources from toolbar
- [x] delete selected objects
- [ ] create new Point Manipulator based on Manipulator.
- [ ] DirectionalLight width manipulator.
- [ ] Circle shape radius manipulator

- [ ] mousetools to create scene objects
- [ ] support light frequency
- [ ] support light distribution
- [ ] refactor _sceneObject_ to sceneObject({shape, material})
- [ ] remove class Object like Point from constructors. Use Cx, Cy for example.
- [ ] refactor constructors to accept {key value objects}

- [ ] support light source intensity



- [ ] simulate light as wave

### fix known bugs:
- [x] leaks pointlight inside a circle (since rewrite) FIXED: compareHitPoint distances in raytrace.js
- [x] fix transparent material refrection on exit
- [x] fix concave lens ray intersections
- [ ] rectangle corners leaking: fix linesegment corners hitTest
- [ ] cant use manipulators under shapes: fix svg layering and interaction
- [ ] rotate shapes



