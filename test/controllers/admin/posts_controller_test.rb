require "test_helper"

class Admin::PostsControllerTest < ActionDispatch::IntegrationTest
  test "should get new" do
    get admin_posts_new_url
    assert_response :success
  end

  test "should get create" do
    get admin_posts_create_url
    assert_response :success
  end
end
