const PASS_THROUGH_VERTEX_SHADER = `precision mediump float;
attribute vec2 position;
void main()
{
    gl_Position = vec4(position, 0, 1);
}`;

const fragmentPreamble = `precision mediump float;
#define e 2.71828
#define PI 3.14159`


export {PASS_THROUGH_VERTEX_SHADER, fragmentPreamble};