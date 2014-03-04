/** @jsx React.DOM */

// We call RouteCore.bindGlobals to bind Meteor.subscribe, etc. 
// on the server, such that we can use them in our routes.
RouteCore.bindGlobals();

Todos = new Meteor.Collection('todos');

var NewTodoForm = React.createClass({
	getInitialState: function() {
		return { title: '' };
	},

	keyDown: function(e) {
		if (e.keyCode === 13) {
			// ENTER

			var title = this.state.title.trim();
			if (title === '')
				return;

			Todos.insert({
				title: title,
				completed: false,
				created_at: new Date().getTime()
			});

			this.setState({ title: '' });
		}
	},

	type: function(e) {
		this.setState({ title: e.target.value });
	},

	render: function() {
		return (
			<input
				id="new-todo"
				placeholder="What needs to be done?"
				autoFocus={true}
				onKeyDown={this.keyDown}
				onChange={this.type}
				value={this.state.title} />
		);
	}
});

var ClearCompleted = React.createClass({
	clearCompleted: function(e) {
		Todos.find({completed: true}).forEach(function(todo) {
			Todos.remove({_id: todo._id});
		});
	},

	render: function() {
		if (this.props.completeCount === 0)
			return <span />
		return (
			<button
				id="clear-completed"
				onClick={this.clearCompleted}>
				Clear completed ({this.props.completeCount})
			</button>
		);
	}
});

var ToggleAll = React.createClass({
	toggle: function(e) {
		// Determine the state to put the todos into
		var newState = Todos.find({
			completed: false
		}).count() !== 0;

		// Mark each of them as that state
		Todos.find({}).forEach(function(todo) {
			Todos.update({_id: todo._id}, {
				$set: {completed: newState}
			});
		});
	},

	render: function() {
		var allChecked = Todos.find({
			completed: false
		}).count() === 0;

		return (
			<span>
				<input
					id="toggle-all"
					type="checkbox"
					onChange={this.toggle}
					checked={allChecked} />
				<label htmlFor="toggle-all">Mark all as complete</label>
			</span>
		);
	}
});

var Todo = React.createClass({
	getInitialState: function() {
		return {
			editing: false,
			title: this.props.todo.title
		}
	},

	toggle: function(e) {
		var completed = !this.props.todo.completed;
		Todos.update({
			_id: this.props.todo._id
		}, {
			$set: {completed: completed}
		});
	},

	destroy: function(e) {
		Todos.remove({
			_id: this.props.todo._id
		});
	},

	type: function(e) {
		this.setState({
			title: e.target.value
		});
	},

	startEditing: function(e) {
		this.setState({
			editing: true,
			title: this.props.todo.title
		}, function() {
			var node = this.refs.editField.getDOMNode();
			node.focus();
			node.setSelectionRange(node.value.length, node.value.length);
		});
	},

	saveEdits: function() {
		Todos.update({_id: this.props.todo._id}, {
			$set: {
				title: this.state.title
			}
		});

		this.setState({
			editing: false
		});
	},

	keyDown: function(e) {
		if (e.keyCode === 13) {
			// ENTER
			this.saveEdits();
		} else if (e.keyCode === 27) {
			// ESCAPE
			this.setState({
				editing: false,
				title: this.props.todo.title
			});
		}
	},


	render: function() {
		var todo = this.props.todo;
		var className = (
			(todo.completed ? 'completed' : '') +
			(this.state.editing ? ' editing' : '')
		);

		return (
			<li className={className}>
				<div className="view">
					<input
						className="toggle"
						type="checkbox"
						checked={todo.completed}
						onChange={this.toggle} />

					<label onDoubleClick={this.startEditing}>{todo.title}</label>

					<button
						className="destroy"
						onClick={this.destroy} />
				</div>
				<input
					ref="editField"
					className="edit"
					value={this.state.title}
					onChange={this.type}
					onBlur={this.saveEdits}
					onKeyDown={this.keyDown} />
			</li>
		);
	}
});

var TodoList = React.createClass({
	render: function() {
		return (
			<ul id="todo-list">
				{this.props.todos.map(function(todo, i) {
					return <Todo todo={todo} key={todo._id} />
				})}
			</ul>
		);
	}
});

var TodoApp = React.createClass({
	render: function() {
		Meteor.subscribe('todos');

		var filter = this.props.filter;
		var query = {};
		if (filter === 'active') {
			query = { completed: false };
		} else if (filter === 'completed') {
			query = { completed: true };
		}

		var todos = Todos.find(query, {
			sort: { created_at: 1 }
		});

		var completed = Todos.find({
			completed: true
		}).count();

		var incomplete = Todos.find({
			completed: false
		}).count();

		return (
			<section id="todoapp">
				<header id="header">
					<h1>todos</h1>
					<NewTodoForm />
				</header>

				{(completed + incomplete) > 0
					? (
						<span>
							<section id="main">
								<ToggleAll />
								<TodoList todos={todos} />
							</section>

							<footer id="footer">
								<span id="todo-count">
									<strong>{incomplete}</strong>
									{' '}
									{incomplete === 1 ? 'item' : 'items'} left
								</span>

								<ul id="filters">
									<li>
										<a className={filter === 'none' ? 'selected' : ''}
											href="/">All</a>
									</li>
									<li>
										<a className={filter === 'active' ? 'selected' : ''}
											href="/active">Active</a>
									</li>
									<li>
										<a className={filter === 'completed' ? 'selected' : ''}
											href="/completed">Completed</a>
									</li>
								</ul>

								<ClearCompleted completeCount={completed} />
							</footer>
						</span>
					)
					: ( undefined )}
			</section>
		);
	}
});

var Layout = React.createClass({
	render: function() {
		return (
			<span>
				{this.props.children}

				<footer id="info">
					<p>Double-click to edit a todo</p>
					<p>Created by <a href="https://github.com/mystor">Michael Layzell</a></p>
					<p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
				</footer>
			</span>
		);

	}
});

RouteCore.map(function() {
	this.route('/', function() {
		return (
			<Layout>
				<TodoApp filter="none" />
			</Layout>
		);
	});

	this.route('/active', function() {
		return (
			<Layout>
				<TodoApp filter="active" />
			</Layout>
		);
	});

	this.route('/completed', function() {
		return (
			<Layout>
				<TodoApp filter="completed" />
			</Layout>
		);
	});
});

if (Meteor.isServer) {
	Todos.allow({
		insert: function() {
			return true;
		},
		update: function() {
			return true;
		},
		remove: function() {
			return true;
		}
	});

	Meteor.publish('todos', function() {
		return Todos.find();
	});
}

