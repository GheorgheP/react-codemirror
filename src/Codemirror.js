const React = require('react');
const ReactDOM = require('react-dom');
const PropTypes = require('prop-types');
const className = require('classnames');
const debounce = require('lodash.debounce');
const isEqual = require('lodash.isequal');
const createReactClass = require('create-react-class');

function normalizeLineEndings (str) {
	if (!str) return str;
	return str.replace(/\r\n|\r/g, '\n');
}

const CodeMirror = createReactClass({
	propTypes: {
		autoFocus: PropTypes.bool,
		className: PropTypes.any,
		codeMirrorInstance: PropTypes.func,
		defaultValue: PropTypes.string,
		name: PropTypes.string,
		onChange: PropTypes.func,
		onCursorActivity: PropTypes.func,
		onFocusChange: PropTypes.func,
		onScroll: PropTypes.func,
		options: PropTypes.object,
		path: PropTypes.string,
		value: PropTypes.string,
		preserveScrollPosition: PropTypes.bool,
	},
	getDefaultProps () {
		return {
			preserveScrollPosition: false,
		};
	},
	getCodeMirrorInstance () {
		return this.props.codeMirrorInstance || require('codemirror');
	},
	getInitialState () {
		return {
			isFocused: false,
		};
	},
	componentWillMount () {
		if (this.props.path) {
			console.error('Warning: react-codemirror: the `path` prop has been changed to `name`');
		}
	},
	componentDidMount () {
		const codeMirrorInstance = this.getCodeMirrorInstance();
		this.codeMirror = codeMirrorInstance.fromTextArea(this.textareaNode, this.props.options);
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('cursorActivity', this.cursorActivity);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		this.codeMirror.on('scroll', this.scrollChanged);
		this.codeMirror.setValue(this.props.defaultValue || this.props.value || '');
	},
	componentWillUnmount () {
		// is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
	},
	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		if (this.codeMirror && nextProps.value !== undefined && nextProps.value !== this.props.value && normalizeLineEndings(this.codeMirror.getValue()) !== normalizeLineEndings(nextProps.value)) {
			this.setValue(nextProps.value);
		}
		if (typeof nextProps.options === 'object') {
			this.setOptions(nextProps.options);
		}
	},
	setValue: debounce(function(value) {
		if (this.props.preserveScrollPosition) {
			var prevScrollPosition = this.codeMirror.getScrollInfo();
			this.codeMirror.setValue(value);
			this.codeMirror.scrollTo(prevScrollPosition.left, prevScrollPosition.top);
		} else {
			this.codeMirror.setValue(value);
		}
	}, 0),
	setOptions: debounce(function (options) {
		for (var optionName in options) {
			if (options.hasOwnProperty(optionName)) {
				this.setOptionIfChanged(optionName, options[optionName]);
			}
		}
	}, 0),
	setOptionIfChanged (optionName, newValue) {
 		const oldValue = this.codeMirror.getOption(optionName);
 		if (!isEqual(oldValue, newValue)) {
 			this.codeMirror.setOption(optionName, newValue);
 		}
 	},
	getCodeMirror () {
		return this.codeMirror;
	},
	focus () {
		if (this.codeMirror) {
			this.codeMirror.focus();
		}
	},
	focusChanged (focused) {
		this.setState({
			isFocused: focused,
		});
		this.props.onFocusChange && this.props.onFocusChange(focused);
	},
	cursorActivity (cm) {
		this.props.onCursorActivity && this.props.onCursorActivity(cm);
	},
	scrollChanged (cm) {
		this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
	},
	codemirrorValueChanged (doc, change) {
		if (this.props.onChange && change.origin !== 'setValue') {
			this.props.onChange(doc.getValue(), change);
		}
	},
	render () {
		const editorClassName = className(
			'ReactCodeMirror',
			this.state.isFocused ? 'ReactCodeMirror--focused' : null,
			this.props.className
		);
		return (
			<div className={editorClassName}>
				<textarea
					ref={ref => this.textareaNode = ref}
					name={this.props.name || this.props.path}
					defaultValue={this.props.value}
					autoComplete="off"
					autoFocus={this.props.autoFocus}
				/>
			</div>
		);
	},
});

module.exports = CodeMirror;
