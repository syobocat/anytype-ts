import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, ObjectName, ObjectDescription, Loader, Error, Icon } from 'Component';
import { I, C, focus, Util, translate, analytics, Renderer, keyboard } from 'Lib';
import { commonStore, detailStore } from 'Store';

const BlockBookmark = observer(class BlockBookmark extends React.Component<I.BlockComponent> {

	_isMounted = false;
	node: any = null;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { state, targetObjectId } = block.content;
		const object = detailStore.get(rootId, targetObjectId, [ 'picture' ]);
		const { iconImage, picture, isArchived, isDeleted } = object;
		const url = this.getUrl();

		let element = null;

		if (isDeleted) {
			element = (
				<div className="deleted">
					<Icon className="ghost" />
					<div className="name">{translate('commonDeletedObject')}</div>
				</div>
			);
		} else {
			switch (state) {
				default:
				case I.BookmarkState.Error:
				case I.BookmarkState.Empty: {
					element = (
						<React.Fragment>
							{state == I.BookmarkState.Error ? <Error text={translate('blockBookmarkError')} /> : ''}
							<InputWithFile 
								block={block} 	
								icon="bookmark" 
								textFile="Paste a link" 
								withFile={false} 
								onChangeUrl={this.onChangeUrl} 
								readonly={readonly} 
							/>
						</React.Fragment>
					);
					break;
				};
					
				case I.BookmarkState.Fetching: {
					element = <Loader />;
					break;
				};
					
				case I.BookmarkState.Done: {
					const cn = [ 'inner', 'resizable' ];
					const cnl = [ 'side', 'left' ];
					
					let archive = null;
						
					if (picture) {
						cn.push('withImage');
					};

					if (isArchived) {
						cn.push('isArchived');
					};

					if (block.bgColor) {
						cnl.push('bgColor bgColor-' + block.bgColor);
					};

					if (isArchived) {
						archive = <div className="tagItem isTag archive">{translate('blockLinkArchived')}</div>;
					};

					element = (
						<div 
							className={cn.join(' ')} 
							onClick={this.onClick} 
							onMouseDown={this.onMouseDown}
							{...Util.dataProps({ href: url })}
						>
							<div className={cnl.join(' ')}>
								<ObjectName object={object} />
								<ObjectDescription object={object} />
								<div className="link">
									{iconImage ? <img src={commonStore.imageUrl(iconImage, 16)} className="fav" /> : ''}
									{Util.shortUrl(url)}
								</div>

								{archive}
							</div>
							<div className="side right">
								{picture ? <img src={commonStore.imageUrl(picture, 500)} className="img" /> : ''}
							</div>
						</div>
					);
					break;
				};
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className={[ 'focusable', 'c' + block.id ].join(' ')} 
				tabIndex={0} 
				onKeyDown={this.onKeyDown} 
				onKeyUp={this.onKeyUp} 
				onFocus={this.onFocus}
			>
				{element}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.rebind();
	};
	
	componentDidUpdate () {
		this.resize();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};

	getUrl () {
		const { rootId, block } = this.props;
		const { url, targetObjectId } = block.content;
		const object = detailStore.get(rootId, targetObjectId, [ 'source' ], true);

		return object.source || url;
	};
	
	onClick (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const ids = selection ? selection.get(I.SelectType.Block) : [];

		if (!(keyboard.withCommand(e) && ids.length)) {
			this.open();
		};
	};

	onMouseDown (e: any) {
		e.persist();

		if (keyboard.withCommand(e)) {
			return;
		};

		// middle mouse click
		if (e.button == 1) {
			e.preventDefault();
			e.stopPropagation();

			this.open();
		};
	};

	open () {
		Renderer.send('urlOpen', Util.urlFix(this.getUrl()));
		analytics.event('BlockBookmarkOpenUrl');
	};
	
	onChangeUrl (e: any, url: string) {
		const { rootId, block } = this.props;

		C.BlockBookmarkFetch(rootId, block.id, url);
	};
	
	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		node.off('resize').on('resize', (e: any) => { this.resize(); });
	};
	
	unbind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		node.off('resize');
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getWrapperWidth } = this.props;
		const node = $(this.node);
		const inner = node.find('.inner');
		const rect = (node.get(0) as Element).getBoundingClientRect();
		const mw = getWrapperWidth();

		rect.width <= mw / 2 ? inner.addClass('vertical') : inner.removeClass('vertical');
	};

});

export default BlockBookmark;