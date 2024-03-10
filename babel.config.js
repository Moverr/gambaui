module.exports = {
	presets: [['@vue/cli-plugin-babel/preset', { jsx: false }],"@babel/preset-env"],
	plugins: ['@babel/plugin-proposal-optional-chaining',"@babel/plugin-transform-runtime"]
};
