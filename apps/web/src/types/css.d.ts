/** Allow importing CSS files as side-effect modules */
declare module "*.css" {
  const _: Record<string, string>;
  export default _;
}
