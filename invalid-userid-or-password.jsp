<HTML>
<include name="include/commonHeader" />

<body bgcolor="#ffffff" link="#000099" vlink="#660099" alink="#cc0033">

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="20%">
    <include name="include/commonLeft" />
  </td>
  <td valign="top" align="middle">

<br />
<form method="post" action="j_security_check">
<table cellpadding="0" border="0" cellspacing="0" width="50%">
  <tr>
    <td class="xl" colspan="2"><text text="invalidUserIdOrPassword"/></td>
  </tr>
  <tr><td colspan="2"></td></tr>
  <tr>
    <td width="1%"><text text="userId"/></td>
    <td><input type="text" class="xxs" name="j_username" size="15" /></td>
  </tr>
  <tr>
    <td><text text="password"/></td>
    <td><input type="password" class="xxs" name="j_password" size="15" />  </td>
  </tr>

  <tr>
    <td></td>
    <td>
      <userLogin html="new-user.html" title="I am not a member, register me please" />
    </td>
  </tr>
  <tr>
    <td></td>
    <td><input type="submit" name="s" value="logOn" />  </td>
  </tr>
</table>
<returnUri />
</form>
<!--span class="xs">If you do not remember your Password, click &quot;Give me a new Password&quot; and we will send it to the email address you specified when you registered.</span-->
</td></tr></table>

<include name="include/commonFooter" />
</BODY>

</HTML>