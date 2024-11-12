#ifdef VALIDATE
  // Vertex shader output variables that THREE-CustomShaderMaterial defines
  // from https://github.com/FarazzShaikh/THREE-CustomShaderMaterial?tab=readme-ov-file#output-variables

  // = Custom vertex position.
  vec3 csm_Position;
  // = Direct equivalent of `gl_Position`.
  vec4 csm_PositionRaw;
  // = Custom vertex normals.
  vec3 csm_Normal;
  // = Direct equivalent of `gl_PointSize`.
  float csm_PointSize;
#endif
