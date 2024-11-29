#ifdef VALIDATE
  // Vertex shader uniforms and attributes that Three.js defines
  // from https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

  // = object.matrixWorld
  uniform mat4 modelMatrix;
  // = camera.matrixWorldInverse * object.matrixWorld
  uniform mat4 modelViewMatrix;
  // = camera.projectionMatrix
  uniform mat4 projectionMatrix;
  // = camera.matrixWorldInverse
  uniform mat4 viewMatrix;
  // = inverse transpose of modelViewMatrix
  uniform mat3 normalMatrix;
  // = camera position in world space
  uniform vec3 cameraPosition;

  // default vertex attributes provided by BufferGeometry
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;

  // USE_TANGENT
  attribute vec4 tangent;
  #ifndef VALIDATE_THREE_NO_COLOR
    // USE_COLOR_ALPHA
    // vertex color attribute with alpha
    attribute vec4 color;
    // USE_COLOR
    // vertex color attribute
    // attribute vec3 color;
  #endif

  // USE_MORPHTARGETS
  attribute vec3 morphTarget0;
  attribute vec3 morphTarget1;
  attribute vec3 morphTarget2;
  attribute vec3 morphTarget3;
  // -- USE_MORPHNORMALS
  attribute vec3 morphNormal0;
  attribute vec3 morphNormal1;
  attribute vec3 morphNormal2;
  attribute vec3 morphNormal3;
  // -- else
  attribute vec3 morphTarget4;
  attribute vec3 morphTarget5;
  attribute vec3 morphTarget6;
  attribute vec3 morphTarget7;

  // USE_SKINNING
  attribute vec4 skinIndex;
  attribute vec4 skinWeight;

  // USE_INSTANCING
  // Note that modelViewMatrix is not set when rendering an instanced model,
  // but can be calculated from viewMatrix * modelMatrix.
  //
  // Basic Usage:
  // gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  attribute mat4 instanceMatrix;
#endif
