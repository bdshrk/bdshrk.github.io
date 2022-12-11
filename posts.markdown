---
layout: page
title: "Posts"
navindex: -50
---


# All Posts

<table>
{% for post in site.posts %}
<tr>
	<td>
		<span class="date">{{ post.date | date: "%Y-%m-%d" }}</span>&emsp;
	</td>
	<td><a href="{{ post.url }}">{{ post.title }}</a></td>
</tr>
{% endfor %}
</table>