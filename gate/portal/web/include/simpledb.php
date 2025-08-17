<?php

define('AUTH_NOTAVAIL', 'AUTH_NOTAVAIL');

class SimpleDb {
	private $trace = true;
	private $link = null;
	
	function __construct() {
		global $db_host, $db_user, $db_pass, $db_name, $db_port;
		global $mysql_use_utf8, $mysql_use_utf8mb4;

		error_log($db_host."-". $db_user."-".$db_pass."-" . $db_name."-" .$db_port);
		$link = mysqli_connect($db_host, $db_user, $db_pass, $db_name, $db_port) or abort(AUTH_NOTAVAIL, mysqli_error());

		$this->link = $link;
		
		
		if ($mysql_use_utf8mb4) {
			$this->execute("set names utf8mb4");
		} else if ($mysql_use_utf8) {
			$this->execute("set names utf8");
		}
		
	}
	
	function disconnect() {
		mysqli_close($this->link);
	}
	
	function get_one($sql, $params = null) {
		$sql = $this->_params($sql, $params);
		
		if ($this->trace) error_log($sql);
		$result = mysqli_query($this->link, $sql);
		if ($result == FALSE) throw new Exception(mysqli_error($this->link));
		
		$one = null;
		if ($row = mysqli_fetch_array($result, MYSQLI_NUM)) {
			$one = $row[0];
		}
		mysqli_free_result($result);
		return $one;
	}
	
	function exists($sql, $params) {
		return $this->get_one($sql, $params) != null;
	}
	
	function get_row($sql, $params) {
		$rows = $this->get_array($sql, $params, 1);
		
		return count($rows) == 0?null:$rows[0];
	}
	
	function get_array($sql, $params = null, $limit = 0) {
		if ($limit != 0) $sql .= ' limit '.$limit;
		
		$sql = $this->_params($sql, $params);
		if ($this->trace) error_log($sql);
		$result = mysqli_query($this->link, $sql);
		if ($result == FALSE) throw new Exception(mysqli_error($this->link));
	
		$rows = array();
		while ($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
			$rows[] = $row;
		}
		mysqli_free_result($result);
	
		return $rows;
	}
	
	function execute($sql, $params = null) {
		$sql = $this->_params($sql, $params);
		if ($this->trace) error_log($sql);
		if (mysqli_query($this->link, $sql) === FALSE) throw new Exception(mysqli_error($this->link));
	}
	
	function get_last_id() {
		return mysqli_insert_id($this->link);
	}
	
	function get_affected_rows() {
		return mysqli_affected_rows($this->link);
	}
	
	function prepare($sql, $params) {
		return $this->_params($sql, $params);
	}
	
	function get_matched_rows() {
		preg_match_all ('/(\S[^:]+): (\d+)/', mysqli_info ($this->link), $matches);
		$info = array_combine ($matches[1], $matches[2]);
		return (int)$info['Rows matched'];
	}
	
	private function _params($sql, $params) {
		if ($params == null) return $sql;
		
		$sql = preg_replace('/\?/', "\x1b", $sql);
		if (is_array($params)) {
			foreach($params as $param) {
				$sql = $this->param_replace($sql, $param);
			}
		} else {
			$sql = $this->param_replace($sql, $params);
		}
		return $sql;
	}
	
	private function param_replace($sql, $param) {
		$pattern = "/\x1b/";
		if ($param === null) {
			return preg_replace($pattern, 'null', $sql, 1);
		}
		
		$param = str_replace("'", " ", $param);
		$param = str_replace("\\", "\\\\", $param);
		$param = str_replace("$", "\\\$", $param);
		return preg_replace($pattern, "'$param'", $sql, 1);
	}
	
	function get_link() {
		return $this->link;
	}
	
	function begin() {
		mysqli_begin_transaction($this->link);
	}

	function commit() {
		mysqli_commit($this->link);
	}
	
	function rollback() {
		mysqli_rollback($this->link);
	}
	
	function trace_on() {
		$this->trace = true;
	}
	
	function trace_off() {
		$this->trace = false;
	}
}
?>
