import sys
import os
import json
import sqlite3
import unittest
from unittest.mock import patch, MagicMock

# Add the directory to sys.path to import gateway
sys.path.append(os.path.join(os.path.dirname(__file__), "gateway"))
import gateway

class TestGatewayBuffering(unittest.TestCase):
    def setUp(self):
        # Use a temporary database for testing
        gateway.DB_PATH = "test_gateway.db"
        if os.path.exists(gateway.DB_PATH):
            os.remove(gateway.DB_PATH)
        gateway.init_db()

    def tearDown(self):
        if os.path.exists(gateway.DB_PATH):
            os.remove(gateway.DB_PATH)

    def test_db_operations(self):
        self.assertTrue(gateway.buffer_is_empty())
        
        payload = {"test": 1}
        gateway.save_to_buffer(payload)
        self.assertFalse(gateway.buffer_is_empty())
        
        entry = gateway.get_from_buffer()
        self.assertIsNotNone(entry)
        entry_id, payload_json = entry
        self.assertEqual(json.loads(payload_json), payload)
        
        gateway.delete_from_buffer(entry_id)
        self.assertTrue(gateway.buffer_is_empty())

    @patch("gateway.post_reading")
    @patch("serial.Serial")
    def test_main_logic_flow(self, mock_serial, mock_post):
        # Setup mock serial to return one line and then stop
        mock_ser_inst = mock_serial.return_value.__enter__.return_value
        mock_ser_inst.readline.side_effect = [
            b'{"led_on": true}\n',
            b'', # stop loop
            Exception("Stop") # break while True
        ]
        
        # 1. Test success: Direct POST
        mock_post.return_value = (200, "OK")
        
        try:
            gateway.main()
        except Exception as e:
            if str(e) != "Stop": raise
            
        self.assertEqual(mock_post.call_count, 1)
        self.assertTrue(gateway.buffer_is_empty())
        
        # 2. Test failure: Buffering
        mock_post.reset_mock()
        mock_ser_inst.readline.side_effect = [
            b'{"led_on": false}\n',
            b'',
            Exception("Stop")
        ]
        from urllib import error
        mock_post.side_effect = error.URLError("Server down")
        
        try:
            gateway.main()
        except Exception as e:
            if str(e) != "Stop": raise
            
        self.assertFalse(gateway.buffer_is_empty())
        entry = gateway.get_from_buffer()
        self.assertIn('"ledOn": false', entry[1])
        
        # 3. Test Recovery: Flush buffer
        mock_post.reset_mock()
        mock_post.side_effect = None
        mock_post.return_value = (200, "OK")
        
        # We need to run main again to trigger flush
        mock_ser_inst.readline.side_effect = [
            b'', # No new data
            b'',
            Exception("Stop")
        ]
        
        try:
            gateway.main()
        except Exception as e:
            if str(e) != "Stop": raise
            
        self.assertTrue(gateway.buffer_is_empty())
        self.assertEqual(mock_post.call_count, 1)

if __name__ == "__main__":
    unittest.main()
