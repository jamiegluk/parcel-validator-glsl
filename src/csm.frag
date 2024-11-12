#ifdef VALIDATE
  // Vertex shader output variables that THREE-CustomShaderMaterial defines
  // from https://github.com/FarazzShaikh/THREE-CustomShaderMaterial?tab=readme-ov-file#output-variables

  // = Custom diffuse color.
  vec4 csm_DiffuseColor;
  // = Direct equivalent of `gl_FragColor`.
  vec4 csm_FragColor;
  // = Custom roughness.
  float csm_Roughness;
  // = Custom metalness.
  float csm_Metalness;
  // = Custom AO.
  float csm_AO;
  // = Custom bump as perturbation to fragment normals.
  vec3 csm_Bump;
  // = Custom clearcoat factor.
  float csm_Clearcoat;
  // = Custom clearcoat roughenss factor.
  float csm_ClearcoatRoughness;
  // = Custom clearcoat normal.
  vec3 csm_ClearcoatNormal;
  // = Custom transmission factor.
  float csm_Transmission;
  // = Custom transmission thickness.
  float csm_Thickness;
  // = Custom iridescence factor.
  float csm_Iridescence;
  // = Custom emissive color.
  vec3 csm_Emissive;
  // = Custom fragment normal.
  vec3 csm_FragNormal;

  // = Custom alpha for `MeshDepthMaterial`.
  vec3 csm_DepthAlpha;
  // = Custom mix between `csm_DiffuseColor` and `csm_FragColor`.
  vec3 csm_UnlitFac;
#endif
